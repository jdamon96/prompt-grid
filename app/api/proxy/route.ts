import { NextRequest, NextResponse } from 'next/server';

interface FormattedResponse {
  success: boolean;
  status: number;
  imageUrl?: string | null;
}

interface RequestHeaders {
  [key: string]: string;
}

// Define request body types for different models
interface OpenAIImageRequestBody {
  prompt: string;
  model: string;
  n: number;
  size?: string;
  quality?: string;
  style?: string;
  response_format?: string;
  // GPT-image-1 specific
  background?: string;
  moderation?: string;
  output_format?: string;
  output_compression?: number;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const { apiEndpoint, apiKey, prompt, parameters, modelName } = await req.json();
    
    // Validate required fields
    if (!apiEndpoint) {
      return NextResponse.json(
        { error: 'API endpoint is required' }, 
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' }, 
        { status: 400 }
      );
    }
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' }, 
        { status: 400 }
      );
    }
    
    // Log request without sensitive information
    console.log(`Processing request for model: ${modelName}, endpoint: ${apiEndpoint}`);
    
    // Handle different API formats based on the endpoint
    let requestBody: any;
    let headers: RequestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Determine which API we're calling and format accordingly
    if (apiEndpoint.includes('openai.com')) {
      // OpenAI API format (works for DALL-E 2, DALL-E 3, and GPT-image-1)
      const model = parameters.model || 'dall-e-2';
      const isGptImage = model === 'gpt-image-1';
      const isDallE2 = model === 'dall-e-2';
      const isDallE3 = model === 'dall-e-3';
      
      // Start with common parameters
      const openAIBody: OpenAIImageRequestBody = {
        prompt,
        model,
        n: parameters.n || 1,
        size: parameters.size || "1024x1024"
      };
      
      // Add model-specific parameters
      if (isGptImage) {
        // GPT-image-1 specific parameters
        if (parameters.background) openAIBody.background = parameters.background;
        if (parameters.moderation) openAIBody.moderation = parameters.moderation;
        if (parameters.output_format) openAIBody.output_format = parameters.output_format;
        if (parameters.quality) openAIBody.quality = parameters.quality;
        
        // Add optional compression if output format is webp or jpeg
        if ((parameters.output_format === 'webp' || parameters.output_format === 'jpeg') && 
            parameters.output_compression !== undefined) {
          openAIBody.output_compression = parameters.output_compression;
        }
      } else {
        // DALL-E 2 & 3 common parameters
        openAIBody.response_format = parameters.response_format || 'url';
        
        // DALL-E 3 specific parameters
        if (isDallE3) {
          // Force n=1 for DALL-E 3 as it doesn't support multiple images
          openAIBody.n = 1;
          
          if (parameters.quality) openAIBody.quality = parameters.quality;
          if (parameters.style) openAIBody.style = parameters.style;
        }
      }
      
      requestBody = openAIBody;
      
      // Log the request body for debugging (without API key)
      console.log(`OpenAI request for ${model}:`, JSON.stringify({
        ...openAIBody,
        prompt: openAIBody.prompt.substring(0, 20) + '...' // Truncate for privacy
      }));
    } else if (apiEndpoint.includes('stability.ai')) {
      // Stability AI API format
      requestBody = {
        text_prompts: [{ text: prompt }],
        cfg_scale: parameters.temperature ? parameters.temperature * 10 : 7,
        width: 1024,
        height: 1024,
        samples: 1,
        ...parameters
      };
    } else if (apiEndpoint.includes('generativelanguage.googleapis.com') && apiEndpoint.includes('generateContent')) {
      // Google Gemini text + image generation
      headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      };
      
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          ...parameters.config
        }
      };
    } else if (apiEndpoint.includes('generativelanguage.googleapis.com') && apiEndpoint.includes('generateImages')) {
      // Google Imagen 3 API
      headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      };
      
      requestBody = {
        prompt,
        config: {
          numberOfImages: parameters.numberOfImages || 1,
          aspectRatio: parameters.aspectRatio || "1:1",
          personGeneration: parameters.personGeneration || "ALLOW_ADULT",
          ...parameters.config
        }
      };
    } else {
      // Default generic format
      requestBody = {
        prompt,
        ...parameters
      };
    }
    
    // Forward the request to the AI service
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    // Parse the response
    const data = await response.json();
    
    // Check for API-specific error responses
    if (!response.ok) {
      console.error('API error:', data);
      
      // Extract more detailed error information based on API provider
      let errorMessage = 'Failed to generate image';
      
      if (apiEndpoint.includes('openai.com')) {
        errorMessage = data.error?.message || 
                      data.error?.code || 
                      'OpenAI API error: Failed to generate image';
      } else if (apiEndpoint.includes('stability.ai')) {
        errorMessage = data.message || 'Stability AI error';
      } else if (apiEndpoint.includes('generativelanguage.googleapis.com')) {
        errorMessage = data.error?.message || 'Google API error';
      }
      
      return NextResponse.json(
        { error: errorMessage }, 
        { status: response.status }
      );
    }
    
    // Format the response based on the API
    let formattedResponse: FormattedResponse = { 
      success: true,
      status: response.status
    };
    
    if (apiEndpoint.includes('openai.com')) {
      const model = parameters.model || 'dall-e-2';
      const isGptImage = model === 'gpt-image-1';
      
      if (isGptImage) {
        // GPT-image-1 returns base64 directly
        const base64Image = data.data?.[0]?.b64_json;
        if (base64Image) {
          const format = parameters.output_format || 'png';
          formattedResponse.imageUrl = `data:image/${format};base64,${base64Image}`;
        }
      } else {
        // DALL-E models return URL by default with response_format=url
        formattedResponse.imageUrl = data.data?.[0]?.url;
        
        // Handle b64_json response format if specified
        if (parameters.response_format === 'b64_json') {
          const base64Image = data.data?.[0]?.b64_json;
          if (base64Image) {
            formattedResponse.imageUrl = `data:image/png;base64,${base64Image}`;
          }
        }
      }
    } else if (apiEndpoint.includes('stability.ai')) {
      // Stability AI response format
      formattedResponse.imageUrl = data.artifacts?.[0]?.base64 
        ? `data:image/png;base64,${data.artifacts[0].base64}`
        : null;
    } else if (apiEndpoint.includes('generativelanguage.googleapis.com') && apiEndpoint.includes('generateContent')) {
      // Google Gemini response format
      // Find the image part in the response
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          formattedResponse.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } else if (apiEndpoint.includes('generativelanguage.googleapis.com') && apiEndpoint.includes('generateImages')) {
      // Google Imagen 3 response format
      const generatedImages = data.generatedImages || [];
      if (generatedImages.length > 0) {
        const firstImage = generatedImages[0];
        formattedResponse.imageUrl = `data:image/png;base64,${firstImage.image.imageBytes}`;
      }
    } else {
      // Default - pass through the image URL field
      formattedResponse.imageUrl = data.imageUrl || data.image || data.url || null;
    }
    
    return NextResponse.json(formattedResponse);
  } catch (error: any) {
    console.error('Proxy API error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to process request';
    
    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
      console.error(error.stack);
    }
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
} 