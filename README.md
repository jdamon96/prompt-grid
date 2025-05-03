# Prompt Grid - AI Image Generation Comparison Tool

A web application that allows users to compare multiple AI image generation models with different prompts in a grid layout.

## Features

- Create a grid with multiple models (columns) and prompts (rows)
- Add and remove models and prompts dynamically
- Configure each model with its own API endpoint and key
- Secure handling of API keys through a proxy service
- Visual comparison of generated images
- Supports multiple leading image generation APIs

## Security Details

This application follows best security practices for handling API keys:

- API keys are never stored on the server
- Keys are only used for the specific request to the AI service
- Communication happens through a secure proxy that forwards requests
- All requests use HTTPS encryption
- API keys are only stored in browser memory during the session

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- API keys for the image generation services you want to use

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/prompt-grid.git
cd prompt-grid
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting Up API Keys

1. Click the Settings (gear) icon next to each model name
2. Enter your API key for the selected service
3. Adjust other parameters as needed
4. Click Save to store the configuration (keys are only stored in browser memory)

## Supported Image Generation APIs

The application comes with built-in support for multiple image generation APIs:

### OpenAI DALL-E Models
- **API Endpoint**: `https://api.openai.com/v1/images/generations`
- **Models**: DALL-E 3, DALL-E 2
- **Required Parameters**: `model` (set to "dall-e-3" or "dall-e-2")
- [API Documentation](https://platform.openai.com/docs/api-reference/images/create)

### OpenAI GPT-image-1
- **API Endpoint**: `https://api.openai.com/v1/images/generations`
- **Model Parameter**: "gpt-image-1"
- **Key Features**:
  - Background options (auto, transparent, opaque)
  - Quality settings (auto, high, medium, low)
  - Output format (png, jpeg, webp)
- [API Documentation](https://platform.openai.com/docs/api-reference/images/create)

### Google Gemini Image Generation
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp-image-generation:generateContent`
- **Features**:
  - Combined text and image generation
  - Uses the experimental image generation model
- [API Documentation](https://ai.google.dev/api/gemini-api/rest/v1/models/generateContent)

### Google Imagen 3
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-002:generateImages`
- **Features**:
  - Multiple aspect ratios (1:1, 16:9, 9:16, 4:3, 3:4)
  - Person generation control
  - Multiple images per request (up to 4)
- [API Documentation](https://ai.google.dev/api/gemini-api/rest/v1/models/generateImages)

### Stability AI
- **API Endpoint**: `https://api.stability.ai/v1/generation`
- **Features**:
  - Multiple engine options
  - Fine-grained control over image generation
- [API Documentation](https://platform.stability.ai/docs/api-reference)

## Adding a Custom Model

You can add custom image generation models by selecting "Custom model" from the add model menu. Specify:

1. The API endpoint
2. Your API key
3. Any required parameters

The proxy will pass your request through to the API and attempt to extract the image URL from the response.

## Deployment

This application can be easily deployed on Vercel:

```bash
npm run build
npm run start
# or deploy directly to Vercel
vercel
```

## License

MIT

## Acknowledgments

- Built with Next.js, React, and TailwindCSS
- Uses a secure proxy approach for API key handling
