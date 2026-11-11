const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const routes = require("./routes");

const app = express();

app.disable("x-powered-by");

// Allow your local frontend to make requests.
const clientUrl = process.env.CLIENT_URL || "http://localhost:5500";

app.use(helmet());

app.use(
  cors({
    origin: clientUrl,
  })
);

// Limit the size of incoming JSON requests.
app.use(express.json({ limit: "32kb" }));

// Require JSON objects for requests that send data.
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    if (
      !req.is("application/json") ||
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }
  }

  next();
});

app.use("/api", routes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  console.error("Unhandled request error:", error.message);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;