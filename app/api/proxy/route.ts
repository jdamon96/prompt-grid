import { NextRequest, NextResponse } from 'next/server';

interface FormattedResponse {
  success: boolean;
  status: number;
  imageUrl?: string | null;
  error?: string;
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
  [key: string]: unknown;
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
    let requestBody: Record<string, unknown>;
    let headers: RequestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Determine which API we're calling and format accordingly
    if (apiEndpoint.includes('openai.com')) {
      // OpenAI API format (works for DALL-E 2, DALL-E 3, and GPT-image-1)
      const model = parameters.model || 'dall-e-2';
      const isGptImage = model === 'gpt-image-1';
      // const isDallE2 = model === 'dall-e-2'; // Commented out since it's unused
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
        },
        model: parameters.model || "gemini-2.0-flash-exp-image-generation"
      };
    } else if (apiEndpoint.includes('generativelanguage.googleapis.com') && apiEndpoint.includes('predict') && parameters.model?.includes('imagen')) {
      // Google Imagen 3 API - using correct predict endpoint format
      headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      };
      
      // The correct Imagen 3 API format based on docs
      requestBody = {
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          sampleCount: parameters.numberOfImages || 1,
          aspectRatio: parameters.aspectRatio || "1:1",
          personGeneration: parameters.personGeneration || "ALLOW_ADULT"
        }
      };
      
      // Log the request body for debugging (without API key)
      console.log(`Imagen 3 request:`, JSON.stringify({
        ...requestBody,
        prompt: { text: prompt.substring(0, 20) + '...' } // Truncate for privacy
      }));
    } else {
      // Default generic format
      requestBody = {
        prompt,
        ...parameters
      };
    }
    
    // Forward the request to the AI service
    console.log(`Sending request to: ${apiEndpoint}`);
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    // Log the raw response before parsing
    const responseText = await response.text();
    console.log(`Raw API response (first 500 chars): ${responseText.substring(0, 500)}`);
    
    // Parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: unknown) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response status:', response.status, response.statusText);
      console.error('Response headers:', Object.fromEntries([...response.headers.entries()]));
      console.error('Raw response body:', responseText);
      
      return NextResponse.json(
        { error: `API returned invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}. Raw response: ${responseText.substring(0, 100)}...` },
        { status: 500 }
      );
    }
    
    // Check for API-specific error responses
    if (!response.ok) {
      console.error('API error - Status:', response.status, 'Response:', JSON.stringify(data));
      
      // Extract more detailed error information based on API provider
      let errorMessage = 'Failed to generate image';
      
      if (apiEndpoint.includes('openai.com')) {
        errorMessage = data.error?.message || 
                      data.error?.code || 
                      'OpenAI API error: Failed to generate image';
      } else if (apiEndpoint.includes('stability.ai')) {
        errorMessage = data.message || 'Stability AI error';
      } else if (apiEndpoint.includes('generativelanguage.googleapis.com')) {
        // Google APIs have different error formats
        const originalMessage = data.error?.message || 
                              data.error?.details || 
                              data.error?.status ||
                              (typeof data.error === 'string' ? data.error : 'Google API error');
        
        // Add helpful link for the billing required error
        if (originalMessage.includes("Imagen API is only accessible to billed users")) {
          errorMessage = `${originalMessage} <a href="https://console.cloud.google.com/billing/linkedaccount" target="_blank" class="text-blue-500 underline">Setup Gemini billing</a>`;
        } else {
          errorMessage = originalMessage;
        }
                      
        // Log the specific error structure for debugging
        console.error('Google API error structure:', JSON.stringify(data.error || data));
      }
      
      return NextResponse.json(
        { error: errorMessage }, 
        { status: response.status }
      );
    }
    
    // Format the response based on the API
    const formattedResponse: FormattedResponse = { 
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
      
      // If no image found in the response
      if (!formattedResponse.imageUrl) {
        console.error('No image found in Gemini response:', JSON.stringify(data).substring(0, 200));
        return NextResponse.json(
          { error: 'No image was generated by Gemini' },
          { status: 400 }
        );
      }
    } else if (apiEndpoint.includes('generativelanguage.googleapis.com') && apiEndpoint.includes('predict') && parameters.model?.includes('imagen')) {
      // Google Imagen 3 response format - log the full response for debugging
      console.log('Imagen 3 complete response data:', JSON.stringify(data));
      
      // Format from official docs
      if (data.predictions && data.predictions.length > 0) {
        // Check for different possible keys for the base64 image data
        const image = data.predictions[0]?.bytesBase64 || 
                     data.predictions[0]?.bytesBase64Encoded || 
                     data.predictions[0]?.imageBytes;
                     
        if (image) {
          formattedResponse.imageUrl = `data:image/png;base64,${image}`;
          console.log("Successfully extracted image from Imagen response");
        } else {
          console.error('Imagen response has predictions but no image data. Available keys:', 
            Object.keys(data.predictions[0]).join(', '),
            'Structure:', JSON.stringify(data.predictions[0])
          );
          return NextResponse.json(
            { error: 'Imagen response has predictions but no image data was found.' },
            { status: 400 }
          );
        }
      } 
      // Try alternative formats (API might change)
      else if (data.images && data.images.length > 0) {
        const image = data.images[0]?.bytesBase64 || 
                     data.images[0]?.bytesBase64Encoded || 
                     data.images[0]?.data;
        if (image) {
          formattedResponse.imageUrl = `data:image/png;base64,${image}`;
          console.log("Successfully extracted image from alternative format");
        }
      }
      else {
        console.error('No valid predictions found in Imagen response. Response structure:', 
          Object.keys(data).join(', '), 
          'Full JSON:', JSON.stringify(data)
        );
        return NextResponse.json(
          { error: 'No valid image was generated by Imagen. API response format unexpected.' },
          { status: 400 }
        );
      }
    } else {
      // Default - pass through the image URL field
      formattedResponse.imageUrl = data.imageUrl || data.image || data.url || null;
    }
    
    return NextResponse.json(formattedResponse);
  } catch (error: unknown) {
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