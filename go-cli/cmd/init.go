package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
	"github.com/Jorlex27/go-cli/utils"
)

// InitCmd represents the init command
var InitCmd = &cobra.Command{
	Use:   "init [projectName]",
	Short: "Initialize a new project",
	Long:  `Initialize a new Go web application with MongoDB integration`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		projectName := args[0]
		createProject(projectName)
	},
}

func createProject(projectName string) {
	// Create base directory
	projectDir := projectName
	fmt.Printf("Creating project: %s\n", projectName)

	// Create directory structure
	dirs := []string{
		"",
		"cmd",
		"config",
		"controllers",
		"middlewares",
		"models",
		"routes",
		"services",
		"utils",
	}

	for _, dir := range dirs {
		dirPath := filepath.Join(projectDir, dir)
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			fmt.Printf("Error creating directory %s: %v\n", dirPath, err)
			return
		}
	}

	// Create main.go
	mainContent := `package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"` + getModulePath(projectName) + `/config"
	"` + getModulePath(projectName) + `/routes"
)

func main() {
	// Initialize config
	config.Init()

	// Initialize router
	router := gin.Default()
	
	// Register routes
	routes.RegisterRoutes(router)
	
	// Start server
	port := config.GetEnv("PORT", "8080")
	fmt.Printf("Server running on port %s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}`

	if err := utils.WriteToFile(filepath.Join(projectDir, "main.go"), mainContent); err != nil {
		fmt.Printf("Error creating main.go: %v\n", err)
		return
	}

	// Create go.mod
	goModContent := `module ` + getModulePath(projectName) + `

go 1.20

require (
	github.com/gin-gonic/gin v1.9.1
	go.mongodb.org/mongo-driver v1.13.1
)
`
	if err := utils.WriteToFile(filepath.Join(projectDir, "go.mod"), goModContent); err != nil {
		fmt.Printf("Error creating go.mod: %v\n", err)
		return
	}

	// Create config.go
	configContent := `package config

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	mongoClient *mongo.Client
	database    *mongo.Database
)

// Init initializes the configuration
func Init() {
	initMongoDB()
}

// GetEnv gets an environment variable or returns a default value
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetMongoClient returns the MongoDB client
func GetMongoClient() *mongo.Client {
	return mongoClient
}

// GetDatabase returns the MongoDB database
func GetDatabase() *mongo.Database {
	return database
}

// initMongoDB initializes the MongoDB connection
func initMongoDB() {
	mongoURI := GetEnv("MONGO_URI", "mongodb://localhost:27017")
	dbName := GetEnv("DB_NAME", "` + projectName + `")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}

	// Ping the database
	if err = client.Ping(ctx, nil); err != nil {
		log.Fatal(err)
	}

	mongoClient = client
	database = client.Database(dbName)
	
	log.Println("Connected to MongoDB!")
}

// CloseMongoConnection closes the MongoDB connection
func CloseMongoConnection() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	if mongoClient != nil {
		if err := mongoClient.Disconnect(ctx); err != nil {
			log.Fatal(err)
		}
	}
}`

	if err := utils.WriteToFile(filepath.Join(projectDir, "config", "config.go"), configContent); err != nil {
		fmt.Printf("Error creating config.go: %v\n", err)
		return
	}

	// Create base service.go
	baseServiceContent := `package services

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"` + getModulePath(projectName) + `/config"
	"` + getModulePath(projectName) + `/models"
)

// BaseService provides common methods for all services
type BaseService struct {
	Collection string
}

// GetCollection returns the MongoDB collection
func (s *BaseService) GetCollection() *mongo.Collection {
	return config.GetDatabase().Collection(s.Collection)
}

// FindAll returns all documents with pagination
func (s *BaseService) FindAll(page, limit int, filter interface{}, sort interface{}) ([]bson.M, int64, error) {
	collection := s.GetCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if filter == nil {
		filter = bson.M{}
	}

	if sort == nil {
		sort = bson.M{"createdAt": -1}
	}

	// Calculate skip
	skip := (page - 1) * limit

	// Find options
	findOptions := options.Find()
	findOptions.SetLimit(int64(limit))
	findOptions.SetSkip(int64(skip))
	findOptions.SetSort(sort)

	// Get total
	total, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Find documents
	cursor, err := collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return nil, 0, err
	}

	return results, total, nil
}

// FindByID returns a document by ID
func (s *BaseService) FindByID(id string) (bson.M, error) {
	collection := s.GetCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var result bson.M
	err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// Create creates a new document
func (s *BaseService) Create(data interface{}) (primitive.ObjectID, error) {
	collection := s.GetCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Add timestamps
	now := time.Now()
	
	// Check if data is a type with BaseModel embedded
	if model, ok := data.(models.HasBaseModel); ok {
		baseModel := model.GetBaseModel()
		baseModel.ID = primitive.NewObjectID()
		baseModel.CreatedAt = now
		baseModel.UpdatedAt = now
		model.SetBaseModel(baseModel)
	}

	result, err := collection.InsertOne(ctx, data)
	if err != nil {
		return primitive.NilObjectID, err
	}

	return result.InsertedID.(primitive.ObjectID), nil
}

// Update updates a document
func (s *BaseService) Update(id string, data interface{}) error {
	collection := s.GetCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	// Add updated timestamp
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	// If data is a map, merge it with our update
	if updateData, ok := data.(bson.M); ok {
		for key, value := range updateData {
			update["$set"].(bson.M)[key] = value
		}
	} else {
		update["$set"] = data
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	return err
}

// Delete deletes a document
func (s *BaseService) Delete(id string) error {
	collection := s.GetCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = collection.DeleteOne(ctx, bson.M{"_id": objID})
	return err
}
`

	if err := utils.WriteToFile(filepath.Join(projectDir, "services", "base_service.go"), baseServiceContent); err != nil {
		fmt.Printf("Error creating base_service.go: %v\n", err)
		return
	}

	// Create base model.go
	baseModelContent := `package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// BaseModel contains common fields for all models
type BaseModel struct {
	ID        primitive.ObjectID ` + "`bson:\"_id,omitempty\" json:\"id\"`" + `
	CreatedAt time.Time          ` + "`bson:\"createdAt\" json:\"createdAt\"`" + `
	UpdatedAt time.Time          ` + "`bson:\"updatedAt\" json:\"updatedAt\"`" + `
}

// HasBaseModel is an interface for models that contain BaseModel
type HasBaseModel interface {
	GetBaseModel() *BaseModel
	SetBaseModel(BaseModel)
}
`

	if err := utils.WriteToFile(filepath.Join(projectDir, "models", "base_model.go"), baseModelContent); err != nil {
		fmt.Printf("Error creating base_model.go: %v\n", err)
		return
	}

	// Create routes.go
	routesContent := `package routes

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers all application routes
func RegisterRoutes(router *gin.Engine) {
	// API group
	api := router.Group("/api")
	
	// Register your routes here
	// Example: RegisterUserRoutes(api)
}
`

	if err := utils.WriteToFile(filepath.Join(projectDir, "routes", "routes.go"), routesContent); err != nil {
		fmt.Printf("Error creating routes.go: %v\n", err)
		return
	}

	// Create utils.go
	utilsContent := `package utils

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Response is the standard API response structure
type Response struct {
	Success bool        ` + "`json:\"success\"`" + `
	Message string      ` + "`json:\"message\"`" + `
	Data    interface{} ` + "`json:\"data\"`" + `
}

// ResponseWithPagination is the standard API response with pagination
type ResponseWithPagination struct {
	Success    bool        ` + "`json:\"success\"`" + `
	Message    string      ` + "`json:\"message\"`" + `
	Data       interface{} ` + "`json:\"data\"`" + `
	Total      int64       ` + "`json:\"total\"`" + `
	Page       int         ` + "`json:\"page\"`" + `
	Limit      int         ` + "`json:\"limit\"`" + `
	TotalPages int         ` + "`json:\"totalPages\"`" + `
}

// SuccessResponse returns a success response
func SuccessResponse(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ErrorResponse returns an error response
func ErrorResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, Response{
		Success: false,
		Message: message,
		Data:    data,
	})
}

// PaginationResponse returns a paginated response
func PaginationResponse(c *gin.Context, message string, data interface{}, total int64, page, limit int) {
	totalPages := (int(total) + limit - 1) / limit
	if totalPages < 1 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, ResponseWithPagination{
		Success:    true,
		Message:    message,
		Data:       data,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

// GetPaginationParams gets pagination parameters from request
func GetPaginationParams(c *gin.Context) (page, limit int) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err = strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	return page, limit
}

// ParseQuery parses query parameters to bson.M
func ParseQuery(c *gin.Context, excludeFields ...string) map[string]interface{} {
	query := make(map[string]interface{})
	
	// Add query parameters processing logic here
	
	return query
}

// StructToMap converts a struct to a map
func StructToMap(data interface{}) (map[string]interface{}, error) {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	
	mapData := make(map[string]interface{})
	err = json.Unmarshal(dataBytes, &mapData)
	if err != nil {
		return nil, err
	}
	
	return mapData, nil
}
`

	if err := utils.WriteToFile(filepath.Join(projectDir, "utils", "utils.go"), utilsContent); err != nil {
		fmt.Printf("Error creating utils.go: %v\n", err)
		return
	}

	fmt.Printf("Project %s created successfully!\n", projectName)
}

func getModulePath(projectName string) string {
	// This is a simplistic approach - for a real implementation,
	// you might want to get the module path from user input
	return "github.com/yourusername/" + projectName
}