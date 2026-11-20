package routes

import (
	"net/http"

	"github.com/YehudaBayana/second-brain/server/app"
)

func Init(handlers *app.Handlers) *http.ServeMux {
	mux := http.NewServeMux()
	handlers.Auth.RegisterRoutes(mux, handlers.Protected, handlers.ProtectedWrite)
	handlers.Migrations.RegisterRoutes(mux, handlers.Protected, handlers.ProtectedWrite)
	handlers.Learning.RegisterRoutes(mux, handlers.Protected, handlers.ProtectedWrite)
	return mux
}
