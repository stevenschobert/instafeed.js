// Made by Jasper Clarke <me@jasperclarke.com>
// https://github.com/jasper-clarke

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

type InstagramAccount struct {
	Token string `json:"token"`
}

type Config struct {
	Accounts    map[string]InstagramAccount `json:"-"`
	RefreshFreq string                      `json:"refresh_freq"`
	Port        string                      `json:"port"`
}

type TokenResponse struct {
	NewToken   string `json:"access_token"`
	TokenType  string `json:"token_type"`
	Permission string `json:"permissions"`
	ExpiresIn  int    `json:"expires_in"`
}

type TokenManager struct {
	accounts map[string]*AccountHandler
	config   *Config
	mutex    sync.RWMutex
}

type AccountHandler struct {
	lastRefresh  time.Time
	refreshTimer *time.Timer
	accountID    string
	token        string
	mutex        sync.RWMutex
}

func getDuration(freq string) time.Duration {
	switch freq {
	case "test":
		return 5 * time.Minute
	case "daily":
		return 24 * time.Hour
	case "weekly":
		return 7 * 24 * time.Hour
	case "monthly":
		return 30 * 24 * time.Hour
	default:
		return 24 * time.Hour
	}
}

func (tm *TokenManager) refreshToken(accountID string, handler *AccountHandler) error {
	handler.mutex.RLock()
	currentToken := handler.token
	handler.mutex.RUnlock()

	resp, err := http.Get("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=" + currentToken)
	if err != nil {
		return fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("received non-200 status code: %d", resp.StatusCode)
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return fmt.Errorf("error parsing response: %v", err)
	}

	handler.mutex.Lock()
	handler.token = tokenResp.NewToken
	handler.lastRefresh = time.Now()
	handler.mutex.Unlock()

	log.Printf("Token successfully refreshed for account: %s", accountID)

	// Save updated tokens to config
	if err := saveConfig(tm.config, tm); err != nil {
		log.Printf("Warning: Failed to save updated token to config: %v", err)
	}

	// Schedule next refresh
	tm.scheduleNextRefresh(accountID, handler)

	return nil
}

func (tm *TokenManager) scheduleNextRefresh(accountID string, handler *AccountHandler) {
	handler.mutex.Lock()
	defer handler.mutex.Unlock()

	// Cancel existing timer if any
	if handler.refreshTimer != nil {
		handler.refreshTimer.Stop()
	}

	// Calculate next refresh time based on configuration
	refreshInterval := getDuration(tm.config.RefreshFreq)

	// Create new timer
	handler.refreshTimer = time.AfterFunc(refreshInterval, func() {
		if err := tm.refreshToken(accountID, handler); err != nil {
			log.Printf("Error refreshing token for %s: %v", accountID, err)
			// Retry after a short delay if refresh fails
			time.Sleep(5 * time.Minute)
			tm.scheduleNextRefresh(accountID, handler)
		}
	})
}

func (tm *TokenManager) setupRefreshes() {
	tm.mutex.RLock()
	defer tm.mutex.RUnlock()

	for accountID, handler := range tm.accounts {
		handler.mutex.Lock()
		handler.lastRefresh = time.Now() // Initialize with current time
		handler.mutex.Unlock()

		tm.scheduleNextRefresh(accountID, handler)
	}

	log.Printf("Individual refresh timers set up for all accounts")
}

func loadConfig() (*Config, error) {
	file, err := os.ReadFile("config.json")
	if err != nil {
		return nil, fmt.Errorf("error reading config file: %v", err)
	}

	var rawConfig map[string]json.RawMessage
	if err := json.Unmarshal(file, &rawConfig); err != nil {
		return nil, fmt.Errorf("error parsing config: %v", err)
	}

	config := &Config{
		Accounts: make(map[string]InstagramAccount),
	}

	// Extract refresh_freq and port
	if freq, ok := rawConfig["refresh_freq"]; ok {
		json.Unmarshal(freq, &config.RefreshFreq)
	}
	if port, ok := rawConfig["port"]; ok {
		json.Unmarshal(port, &config.Port)
	}

	// Extract Instagram accounts
	for key, value := range rawConfig {
		if key != "refresh_freq" && key != "port" {
			var account InstagramAccount
			if err := json.Unmarshal(value, &account); err != nil {
				return nil, fmt.Errorf("error parsing account %s: %v", key, err)
			}
			config.Accounts[key] = account
		}
	}

	// Validate refresh frequency
	switch config.RefreshFreq {
	case "daily", "weekly", "monthly", "test":
		// Valid frequency
	default:
		return nil, fmt.Errorf("invalid refresh frequency: %s", config.RefreshFreq)
	}

	return config, nil
}

func saveConfig(config *Config, tokenManager *TokenManager) error {
	// Create the output structure
	output := make(map[string]interface{})
	output["refresh_freq"] = config.RefreshFreq
	output["port"] = config.Port

	// Add all account tokens
	tokenManager.mutex.RLock()
	for id, handler := range tokenManager.accounts {
		handler.mutex.RLock()
		output[id] = InstagramAccount{Token: handler.token}
		handler.mutex.RUnlock()
	}
	tokenManager.mutex.RUnlock()

	// Save to file
	data, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshaling config: %v", err)
	}

	return os.WriteFile("config.json", data, 0o644)
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func (tm *TokenManager) handleGetToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract account ID from path
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) != 3 || parts[1] != "token" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	accountID := parts[2]

	tm.mutex.RLock()
	handler, exists := tm.accounts[accountID]
	tm.mutex.RUnlock()

	if !exists {
		http.Error(w, "Account not found", http.StatusNotFound)
		return
	}

	handler.mutex.RLock()
	response := map[string]string{"token": handler.token}
	handler.mutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (tm *TokenManager) manualRefresh(accountID string) error {
	tm.mutex.RLock()
	handler, exists := tm.accounts[accountID]
	tm.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("account %s not found", accountID)
	}

	return tm.refreshToken(accountID, handler)
}

func main() {
	refreshCmd := flag.NewFlagSet("refresh", flag.ExitOnError)

	// Parse initial arguments
	if len(os.Args) > 1 && os.Args[1] == "refresh" {
		refreshCmd.Parse(os.Args[2:])

		if refreshCmd.NArg() != 1 {
			log.Fatal("Usage: instatokend refresh <account_id>")
		}

		accountID := refreshCmd.Arg(0)

		// Load configuration
		config, err := loadConfig()
		if err != nil {
			log.Fatalf("Error loading config: %v", err)
		}

		// Initialize token manager
		tokenManager := &TokenManager{
			accounts: make(map[string]*AccountHandler),
			config:   config,
		}

		// Initialize account handlers
		for id, account := range config.Accounts {
			tokenManager.accounts[id] = &AccountHandler{
				accountID: id,
				token:     account.Token,
			}
		}

		// Perform manual refresh
		if err := tokenManager.manualRefresh(accountID); err != nil {
			log.Fatalf("Error refreshing token for %s: %v", accountID, err)
		}

		log.Printf("Successfully refreshed token for account: %s", accountID)
		return
	}

	// Load configuration
	config, err := loadConfig()
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	// Initialize token manager
	tokenManager := &TokenManager{
		accounts: make(map[string]*AccountHandler),
		config:   config,
	}

	// Initialize account handlers
	for id, account := range config.Accounts {
		tokenManager.accounts[id] = &AccountHandler{
			accountID: id,
			token:     account.Token,
		}
	}

	// Set up individual refresh timers instead of cron
	tokenManager.setupRefreshes()

	// Set up signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigChan
		log.Println("Saving configuration before shutdown...")
		if err := saveConfig(config, tokenManager); err != nil {
			log.Printf("Error saving config: %v", err)
		}
		os.Exit(0)
	}()

	// Set up HTTP endpoints
	http.HandleFunc("/token/", enableCORS(tokenManager.handleGetToken))

	// Start server
	log.Printf("Starting server on port %s", config.Port)
	if err := http.ListenAndServe(":"+config.Port, nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
