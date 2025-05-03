"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Settings, X, Trash2, AlertCircle, Info, ZoomIn, Download, Lock, Github } from "lucide-react";
import { cn } from "@/lib/utils";

// Define constants at the top, after imports but before component definition
const GITHUB_REPO_URL = "https://github.com/yourusername/prompt-grid";

// Define types for our grid data
type Model = {
  id: string;
  name: string;
  apiEndpoint: string;
  apiKey: string;
  isPreset?: boolean;  // New field to track if this is a preset model
  parameters: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    lockedParams?: string[];  // New field to track locked parameters
    // Add other API-specific parameters
    [key: string]: any;
  };
};

type Prompt = {
  id: string;
  text: string;
};

type GridResult = {
  modelId: string;
  promptId: string;
  imageUrl: string | null;
  status: "idle" | "loading" | "error" | "success";
  error?: string;
};

// Define a new type for the image popup
type ImagePopup = {
  isOpen: boolean;
  imageUrl: string | null;
  prompt: string;
  modelName: string;
};

// Predefined model configurations
const MODEL_PRESETS = {
  dalleTwo: {
    name: "DALL-E 2",
    apiEndpoint: "https://api.openai.com/v1/images/generations",
    apiKey: "",
    isPreset: true,
    parameters: {
      model: "dall-e-2",
      size: "1024x1024",
      quality: "standard",
      n: 1,
      response_format: "url",
      lockedParams: ["model", "response_format", "n", "quality"]
    }
  },
  dalleThree: {
    name: "DALL-E 3",
    apiEndpoint: "https://api.openai.com/v1/images/generations",
    apiKey: "",
    isPreset: true,
    parameters: {
      model: "dall-e-3",
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
      n: 1,
      response_format: "url",
      lockedParams: ["model", "response_format", "n"]
    }
  },
  gptImageOne: {
    name: "GPT-image-1",
    apiEndpoint: "https://api.openai.com/v1/images/generations",
    apiKey: "",
    isPreset: true,
    parameters: {
      model: "gpt-image-1",
      size: "1024x1024",
      quality: "auto",
      background: "auto",
      moderation: "auto",
      output_format: "png",
      output_compression: 100,
      n: 1,
      lockedParams: ["model", "n"]
    }
  },
  stabilityAi: {
    name: "Stability AI",
    apiEndpoint: "https://api.stability.ai/v1/generation",
    apiKey: "",
    isPreset: true,
    parameters: {
      temperature: 0.5,
      maxTokens: 1024
    }
  },
  gemini: {
    name: "Google Gemini",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp-image-generation:generateContent",
    apiKey: "",
    isPreset: true,
    parameters: {
      config: {
        responseModalities: ["TEXT", "IMAGE"]
      },
      lockedParams: []
    }
  },
  imagenThree: {
    name: "Google Imagen 3",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-002:generateImages",
    apiKey: "",
    isPreset: true,
    parameters: {
      numberOfImages: 1,
      aspectRatio: "1:1",
      personGeneration: "ALLOW_ADULT",
      lockedParams: []
    }
  }
};

export default function PromptGrid() {
  // Initial state with 2 models and 2 prompts
  const [models, setModels] = useState<Model[]>([
    { 
      id: "model1", 
      ...MODEL_PRESETS.dalleThree
    },
    { 
      id: "model2", 
      ...MODEL_PRESETS.gptImageOne
    },
  ]);

  const [prompts, setPrompts] = useState<Prompt[]>([
    { id: "prompt1", text: "A cat sitting on a chair" },
    { id: "prompt2", text: "A dog running in the park" },
  ]);

  const [results, setResults] = useState<GridResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [configModelId, setConfigModelId] = useState<string | null>(null);
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  
  // New state for the image popup
  const [imagePopup, setImagePopup] = useState<ImagePopup>({
    isOpen: false,
    imageUrl: null,
    prompt: "",
    modelName: ""
  });

  // Add a new model
  const addModel = (preset?: keyof typeof MODEL_PRESETS) => {
    const newId = `model${models.length + 1}`;
    
    if (preset && MODEL_PRESETS[preset]) {
      setModels([...models, { 
        id: newId, 
        ...MODEL_PRESETS[preset]
      }]);
    } else {
      setModels([...models, { 
        id: newId, 
        name: `Custom Model ${models.length + 1}`,
        apiEndpoint: "",
        apiKey: "",
        isPreset: false,
        parameters: {
          temperature: 0.7,
          maxTokens: 1024
        }
      }]);
    }
    
    setShowPresetSelector(false);
  };

  // Remove a model
  const removeModel = (id: string) => {
    // Remove the model
    setModels(models.filter(model => model.id !== id));
    
    // Remove results for this model
    setResults(results.filter(result => result.modelId !== id));
  };

  // Add a new prompt
  const addPrompt = () => {
    const newId = `prompt${prompts.length + 1}`;
    setPrompts([...prompts, { id: newId, text: "" }]);
  };

  // Remove a prompt
  const removePrompt = (id: string) => {
    // Remove the prompt
    setPrompts(prompts.filter(prompt => prompt.id !== id));
    
    // Remove results for this prompt
    setResults(results.filter(result => result.promptId !== id));
  };

  // Update prompt text
  const updatePromptText = (id: string, text: string) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id ? { ...prompt, text } : prompt
    ));
  };

  // Update model name
  const updateModelName = (id: string, name: string) => {
    setModels(models.map(model => 
      model.id === id ? { ...model, name } : model
    ));
  };

  // Open config for model
  const openModelConfig = (id: string) => {
    setConfigModelId(id);
  };

  // Close config modal
  const closeModelConfig = () => {
    // If there was a model being configured, clear error states for it
    if (configModelId) {
      // Reset error states for cells that had configuration-related errors
      setResults(prev => prev.map(result => 
        result.modelId === configModelId && result.status === 'error' && 
        (result.error?.includes('API key') || 
         result.error?.includes('endpoint') || 
         (result.error?.includes('DALL-E 3') && result.error?.includes('n=1')))
          ? { ...result, status: 'idle', error: undefined, imageUrl: null }
          : result
      ));
    }
    
    setConfigModelId(null);
  };

  // Update model configuration
  const updateModelConfig = (
    id: string, 
    field: 'apiEndpoint' | 'apiKey', 
    value: string
  ) => {
    setModels(models.map(model => 
      model.id === id ? { ...model, [field]: value } : model
    ));
    
    // Clear error states for cells using this model when API key or endpoint is updated
    if (field === 'apiKey' || field === 'apiEndpoint') {
      setResults(prev => prev.map(result => 
        result.modelId === id && (result.status === 'error') && 
        (result.error?.includes('API key') || result.error?.includes('endpoint'))
          ? { ...result, status: 'idle', error: undefined, imageUrl: null }
          : result
      ));
    }
  };

  // Check if a parameter is locked
  const isParamLocked = (model: Model | undefined, paramName: string): boolean => {
    if (!model?.isPreset) return false;
    return model.parameters.lockedParams?.includes(paramName) || false;
  };

  // Update model parameter with locked parameter check
  const updateModelParameter = (
    id: string,
    parameter: string,
    value: number | string
  ) => {
    const model = getModelById(id);
    
    // Don't update if this is a locked parameter
    if (isParamLocked(model, parameter)) return;
    
    setModels(models.map(model => 
      model.id === id ? { 
        ...model, 
        parameters: { 
          ...model.parameters, 
          [parameter]: value 
        } 
      } : model
    ));
    
    // Clear error states for this model when specific parameters are fixed
    if (model?.parameters.model === 'dall-e-3' && parameter === 'n' && value === 1) {
      // Clear DALL-E 3 n=1 errors
      setResults(prev => prev.map(result => 
        result.modelId === id && result.status === 'error' && 
        result.error?.includes('DALL-E 3') && result.error?.includes('n=1')
          ? { ...result, status: 'idle', error: undefined, imageUrl: null }
          : result
      ));
    }
  };

  // Generate images for all combinations
  const generateImages = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    // Create a new results array with all combinations in loading state
    const newResults = models.flatMap(model => 
      prompts.map(prompt => ({
        modelId: model.id,
        promptId: prompt.id,
        imageUrl: null,
        status: "loading" as const,
      }))
    );
    
    setResults(newResults);
    
    // For each combination, call our proxy API
    for (const model of models) {
      for (const prompt of prompts) {
        try {
          // Validate model configuration
          if (!model.apiEndpoint) {
            setResults(prev => prev.map(result => 
              result.modelId === model.id && result.promptId === prompt.id
                ? { ...result, status: "error", error: "Model API endpoint not configured" }
                : result
            ));
            continue;
          }
          
          if (!model.apiKey) {
            setResults(prev => prev.map(result => 
              result.modelId === model.id && result.promptId === prompt.id
                ? { ...result, status: "error", error: "API key not provided" }
                : result
            ));
            continue;
          }
          
          // Special validation for DALL-E 3 (must use n=1)
          if (model.parameters.model === 'dall-e-3' && model.parameters.n !== 1) {
            setResults(prev => prev.map(result => 
              result.modelId === model.id && result.promptId === prompt.id
                ? { ...result, status: "error", error: "DALL-E 3 only supports generating 1 image at a time (n=1)" }
                : result
            ));
            continue;
          }
          
          // Call our secure proxy API
          const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              apiEndpoint: model.apiEndpoint,
              apiKey: model.apiKey, // Key is sent to our proxy but not stored there
              prompt: prompt.text,
              parameters: model.parameters,
              modelName: model.name
            })
          });
          
          const data = await response.json();
          
          if (response.ok && data.success) {
            setResults(prev => prev.map(result => 
              result.modelId === model.id && result.promptId === prompt.id
                ? { 
                    ...result, 
                    status: "success", 
                    imageUrl: data.imageUrl 
                  }
                : result
            ));
          } else {
            throw new Error(data.error || 'Failed to generate image');
          }
        } catch (error: any) {
          console.error(`Error generating image for ${model.name}:`, error);
          setResults(prev => prev.map(result => 
            result.modelId === model.id && result.promptId === prompt.id
              ? { ...result, status: "error", error: error.message || 'An unexpected error occurred' }
              : result
          ));
        }
      }
    }
    
    setIsGenerating(false);
  };

  // Get result for a specific cell
  const getResult = (modelId: string, promptId: string) => {
    return results.find(r => r.modelId === modelId && r.promptId === promptId);
  };

  // Get model by ID
  const getModelById = (id: string) => {
    return models.find(m => m.id === id);
  };

  // Get supported model presets
  const getSupportedModelPresets = () => {
    return Object.entries(MODEL_PRESETS).map(([key, preset]) => ({
      id: key,
      name: preset.name
    }));
  };

  // New function to open the image popup
  const openImagePopup = (imageUrl: string, prompt: string, modelName: string) => {
    setImagePopup({
      isOpen: true,
      imageUrl,
      prompt,
      modelName
    });
    
    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden';
  };

  // New function to close the image popup
  const closeImagePopup = () => {
    setImagePopup({
      ...imagePopup,
      isOpen: false
    });
    
    // Restore body scroll when popup is closed
    document.body.style.overflow = 'auto';
  };
  
  // Function to download the image
  const downloadImage = (imageUrl: string, prompt: string, modelName: string) => {
    // Create an anchor element
    const link = document.createElement('a');
    
    // If it's a data URL, we can download it directly
    if (imageUrl.startsWith('data:')) {
      link.href = imageUrl;
      link.download = `${modelName.replace(/\s+/g, '-').toLowerCase()}-${prompt.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } 
    // If it's a regular URL, we need to fetch it first (for CORS reasons)
    else {
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          link.download = `${modelName.replace(/\s+/g, '-').toLowerCase()}-${prompt.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
          console.error('Error downloading image:', error);
          // Fallback: open in new tab
          window.open(imageUrl, '_blank');
        });
    }
  };

  // Add a new function to generate a single image
  const generateSingleImage = async (model: Model, prompt: Prompt) => {
    // Set just this cell to loading state
    setResults(prev => {
      const existingResult = prev.find(r => r.modelId === model.id && r.promptId === prompt.id);
      
      if (existingResult) {
        return prev.map(result => 
          result.modelId === model.id && result.promptId === prompt.id
            ? { ...result, status: "loading", imageUrl: null, error: undefined }
            : result
        );
      } else {
        return [...prev, {
          modelId: model.id,
          promptId: prompt.id,
          imageUrl: null,
          status: "loading" as const
        }];
      }
    });
    
    try {
      // Validate model configuration
      if (!model.apiEndpoint) {
        setResults(prev => prev.map(result => 
          result.modelId === model.id && result.promptId === prompt.id
            ? { ...result, status: "error", error: "Model API endpoint not configured" }
            : result
        ));
        return;
      }
      
      if (!model.apiKey) {
        setResults(prev => prev.map(result => 
          result.modelId === model.id && result.promptId === prompt.id
            ? { ...result, status: "error", error: "API key not provided" }
            : result
        ));
        return;
      }
      
      // Special validation for DALL-E 3 (must use n=1)
      if (model.parameters.model === 'dall-e-3' && model.parameters.n !== 1) {
        setResults(prev => prev.map(result => 
          result.modelId === model.id && result.promptId === prompt.id
            ? { ...result, status: "error", error: "DALL-E 3 only supports generating 1 image at a time (n=1)" }
            : result
        ));
        return;
      }
      
      // Call our secure proxy API
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiEndpoint: model.apiEndpoint,
          apiKey: model.apiKey,
          prompt: prompt.text,
          parameters: model.parameters,
          modelName: model.name
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setResults(prev => prev.map(result => 
          result.modelId === model.id && result.promptId === prompt.id
            ? { 
                ...result, 
                status: "success", 
                imageUrl: data.imageUrl 
              }
            : result
        ));
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error(`Error generating image for ${model.name}:`, error);
      setResults(prev => prev.map(result => 
        result.modelId === model.id && result.promptId === prompt.id
          ? { ...result, status: "error", error: error.message || 'An unexpected error occurred' }
          : result
      ));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
      <div className="flex justify-between gap-2">
      <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">Prompt Grid</h1>
      <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
        Compare image generation models with different prompts
        <a 
          href={GITHUB_REPO_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
        >
          <Github size={12} />
          <span>Open Source</span>
        </a>
      </p>
      </div>
      <div className="flex justify-center">
        <button
          onClick={generateImages}
          disabled={isGenerating}
          className={cn(
            "px-6 py-3 rounded-full font-medium",
            "bg-black text-white hover:bg-gray-800",
            "dark:bg-white dark:text-black dark:hover:bg-gray-200",
            "transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isGenerating ? "Generating..." : "Generate Images"}
        </button>
      </div>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-500 mt-0.5" size={18} />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Secure API Key Handling</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Your API keys are sent securely to a local API route and are never stored on our servers.
              They remain in your browser only for the duration of your session and are only used for 
              the specific image generation requests. You can verify this by checking the 
              <a 
                href={GITHUB_REPO_URL} 
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-yellow-800 dark:hover:text-yellow-100 ml-1"
              >
                open source code
              </a>.
            </p>
          </div>
        </div>
      </div>
      

      <div className="relative overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="p-4 text-left font-medium min-w-[200px]">
                Prompts \ Models
              </th>
              {models.map(model => (
                <th key={model.id} className="p-4 text-left font-medium min-w-[300px]">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={model.name}
                      onChange={e => updateModelName(model.id, e.target.value)}
                      className="w-full bg-transparent border-b border-dashed border-gray-300 dark:border-gray-700 py-1 px-0 focus:outline-none focus:border-black dark:focus:border-white"
                      placeholder="Model name"
                    />
                    <div className="flex">
                      <button
                        onClick={() => openModelConfig(model.id)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Configure model API"
                      >
                        <Settings size={16} />
                      </button>
                      {models.length > 1 && (
                        <button
                          onClick={() => removeModel(model.id)}
                          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500"
                          title="Remove model"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-4 w-12">
                <div className="relative">
                  <button
                    onClick={() => setShowPresetSelector(prev => !prev)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Add model"
                  >
                    <Plus size={16} />
                  </button>
                  
                  {showPresetSelector && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-10 w-56">
                      <div className="p-1">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                          Add model from preset
                        </div>
                        {getSupportedModelPresets().map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => addModel(preset.id as keyof typeof MODEL_PRESETS)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            {preset.name}
                          </button>
                        ))}
                        <div className="border-t border-gray-200 dark:border-gray-800 my-1"></div>
                        <button
                          onClick={() => addModel()}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          Custom model
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {prompts.map(prompt => (
              <tr key={prompt.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="p-4 align-top">
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={prompt.text}
                      onChange={e => updatePromptText(prompt.id, e.target.value)}
                      className="w-full bg-transparent border border-gray-300 dark:border-gray-700 rounded-md p-2 min-h-[100px] focus:outline-none focus:border-black dark:focus:border-white"
                      placeholder="Enter prompt here..."
                    />
                    {prompts.length > 1 && (
                      <button
                        onClick={() => removePrompt(prompt.id)}
                        className="self-start flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-500 text-xs"
                        title="Remove prompt"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </td>
                {models.map(model => {
                  const result = getResult(model.id, prompt.id);
                  return (
                    <td key={model.id} className="p-4 align-top">
                      <div className="w-full h-[300px] bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center overflow-hidden">
                        {!result && (
                          <div className="text-gray-400 text-sm flex flex-col items-center justify-center gap-3">
                            <span>Click "Generate" to create images</span>
                            <button
                              onClick={() => generateSingleImage(model, prompt)}
                              className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium",
                                "bg-gray-200 text-gray-800 hover:bg-gray-300",
                                "dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
                                "transition-colors"
                              )}
                            >
                              Generate this image
                            </button>
                          </div>
                        )}
                        {result?.status === "loading" && (
                          <div className="animate-pulse text-gray-400">
                            Generating...
                          </div>
                        )}
                        {result?.status === "error" && (
                          <div className="text-red-500 text-sm p-4 text-center flex flex-col items-center gap-3">
                            <span>{result.error || "Error generating image"}</span>
                            <button
                              onClick={() => generateSingleImage(model, prompt)}
                              className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium",
                                "bg-red-100 text-red-700 hover:bg-red-200",
                                "dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50",
                                "transition-colors"
                              )}
                            >
                              Retry
                            </button>
                          </div>
                        )}
                        {result?.status === "success" && result.imageUrl && (
                          <div className="relative w-full h-full group">
                            <Image
                              src={result.imageUrl}
                              alt={`Generated image for ${prompt.text} using ${model.name}`}
                              fill
                              className="object-cover cursor-pointer"
                              onClick={() => openImagePopup(result.imageUrl!, prompt.text, model.name)}
                            />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center gap-2">
                              <button 
                                className="p-2 rounded-full bg-black/70 text-white hover:bg-black"
                                onClick={() => openImagePopup(result.imageUrl!, prompt.text, model.name)}
                                title="View full size"
                              >
                                <ZoomIn size={20} />
                              </button>
                              <button 
                                className="p-2 rounded-full bg-black/70 text-white hover:bg-black"
                                onClick={() => downloadImage(result.imageUrl!, prompt.text, model.name)}
                                title="Download image"
                              >
                                <Download size={20} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="w-12"></td>
              </tr>
            ))}
            <tr className="border-t border-gray-200 dark:border-gray-800">
              <td className="p-4">
                <button
                  onClick={addPrompt}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <Plus size={16} />
                  <span>Add prompt</span>
                </button>
              </td>
              <td colSpan={models.length + 1}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Image Popup */}
      {imagePopup.isOpen && imagePopup.imageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-8"
          onClick={closeImagePopup}
        >
          <div 
            className="max-w-5xl w-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{imagePopup.modelName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {imagePopup.prompt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(imagePopup.imageUrl!, imagePopup.prompt, imagePopup.modelName)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Download image"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={closeImagePopup}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="relative flex-1 min-h-[50vh] overflow-auto bg-[#f5f5f5] dark:bg-[#111] flex items-center justify-center">
              <img
                src={imagePopup.imageUrl}
                alt={`Generated image for prompt: ${imagePopup.prompt}`}
                className="max-w-full max-h-[calc(90vh-8rem)]"
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
              <h4 className="font-medium text-sm mb-1">Prompt:</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {imagePopup.prompt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model Configuration Modal */}
      {configModelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="font-semibold text-lg">
                Configure {getModelById(configModelId)?.name}
                {getModelById(configModelId)?.parameters.model && (
                  <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {getModelById(configModelId)?.parameters.model}
                  </span>
                )}
              </h3>
              <button
                onClick={closeModelConfig}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  API Endpoint
                  {getModelById(configModelId)?.isPreset && (
                    <Lock size={14} className="text-gray-400" />
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={getModelById(configModelId)?.apiEndpoint || ''}
                    onChange={e => updateModelConfig(configModelId, 'apiEndpoint', e.target.value)}
                    disabled={getModelById(configModelId)?.isPreset}
                    className={cn(
                      "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                      getModelById(configModelId)?.isPreset && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    )}
                    placeholder="https://api.example.com/v1/generate"
                  />
                  {getModelById(configModelId)?.isPreset && (
                    <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                      <div className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        Preset
                      </div>
                    </div>
                  )}
                </div>
                {getModelById(configModelId)?.isPreset && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is a preset model. The API endpoint cannot be modified.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={getModelById(configModelId)?.apiKey || ''}
                  onChange={e => updateModelConfig(configModelId, 'apiKey', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white"
                  placeholder="sk-xxxxxxxxxxxx"
                />
              </div>
              
              {/* Model Parameter - show for models that have it */}
              {getModelById(configModelId)?.parameters.model && (
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    Model
                    {isParamLocked(getModelById(configModelId), 'model') && (
                      <Lock size={14} className="text-gray-400" />
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={getModelById(configModelId)?.parameters.model || ''}
                      onChange={e => updateModelParameter(configModelId, 'model', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'model')}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        isParamLocked(getModelById(configModelId), 'model') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    />
                    {isParamLocked(getModelById(configModelId), 'model') && (
                      <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                        <div className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          Preset
                        </div>
                      </div>
                    )}
                  </div>
                  {isParamLocked(getModelById(configModelId), 'model') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This model parameter is locked for this preset.
                    </p>
                  )}
                </div>
              )}
              
              {/* OpenAI Image Models Common Parameters */}
              {getModelById(configModelId)?.apiEndpoint.includes('openai.com') && (
                <>
                  {/* Add model info section */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="text-blue-500 mt-0.5" size={16} />
                      <div>
                        <h3 className="font-medium text-blue-800 dark:text-blue-200 text-sm">About this model</h3>
                        {getModelById(configModelId)?.parameters.model === 'dall-e-2' && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            DALL-E 2 is OpenAI's second-generation image creation model capable of creating realistic images from text descriptions.
                            It supports 256x256, 512x512, and 1024x1024 image sizes with up to 1000 character prompts.
                          </p>
                        )}
                        {getModelById(configModelId)?.parameters.model === 'dall-e-3' && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            DALL-E 3 is OpenAI's third-generation image creation model with improved image quality and prompt following.
                            It supports 1024x1024, 1792x1024, and 1024x1792 image sizes with up to 4000 character prompts.
                          </p>
                        )}
                        {getModelById(configModelId)?.parameters.model === 'gpt-image-1' && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            GPT-image-1 is OpenAI's latest image model combining GPT-4's understanding with advanced image generation.
                            It offers better text rendering, superior composition, and supports up to 32000 character prompts.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                
                  {/* Size parameter - available for all OpenAI models */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Size
                      {isParamLocked(getModelById(configModelId), 'size') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <select
                      value={getModelById(configModelId)?.parameters.size || '1024x1024'}
                      onChange={e => updateModelParameter(configModelId, 'size', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'size')}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        isParamLocked(getModelById(configModelId), 'size') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    >
                      {/* Common for all */}
                      <option value="1024x1024">1024x1024 (Square)</option>
                      
                      {/* DALL-E 2 specific */}
                      {getModelById(configModelId)?.parameters.model === 'dall-e-2' && (
                        <>
                          <option value="256x256">256x256</option>
                          <option value="512x512">512x512</option>
                        </>
                      )}
                      
                      {/* DALL-E 3 specific */}
                      {getModelById(configModelId)?.parameters.model === 'dall-e-3' && (
                        <>
                          <option value="1792x1024">1792x1024 (Landscape)</option>
                          <option value="1024x1792">1024x1792 (Portrait)</option>
                        </>
                      )}
                      
                      {/* GPT-image-1 specific */}
                      {getModelById(configModelId)?.parameters.model === 'gpt-image-1' && (
                        <>
                          <option value="1536x1024">1536x1024 (Landscape)</option>
                          <option value="1024x1536">1024x1536 (Portrait)</option>
                          <option value="auto">Auto</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Quality parameter - all models */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Quality
                      {isParamLocked(getModelById(configModelId), 'quality') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <select
                      value={getModelById(configModelId)?.parameters.quality || 'auto'}
                      onChange={e => updateModelParameter(configModelId, 'quality', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'quality')}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        isParamLocked(getModelById(configModelId), 'quality') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    >
                      {/* Auto option for GPT-image-1 */}
                      {getModelById(configModelId)?.parameters.model === 'gpt-image-1' && (
                        <option value="auto">Auto</option>
                      )}
                      
                      {/* DALL-E 3 options */}
                      {getModelById(configModelId)?.parameters.model === 'dall-e-3' && (
                        <>
                          <option value="standard">Standard</option>
                          <option value="hd">HD</option>
                        </>
                      )}
                      
                      {/* DALL-E 2 only has standard */}
                      {getModelById(configModelId)?.parameters.model === 'dall-e-2' && (
                        <option value="standard">Standard</option>
                      )}
                      
                      {/* GPT-image-1 additional options */}
                      {getModelById(configModelId)?.parameters.model === 'gpt-image-1' && (
                        <>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Style - DALL-E 3 only */}
                  {getModelById(configModelId)?.parameters.model === 'dall-e-3' && (
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        Style
                        {isParamLocked(getModelById(configModelId), 'style') && (
                          <Lock size={14} className="text-gray-400" />
                        )}
                      </label>
                      <select
                        value={getModelById(configModelId)?.parameters.style || 'vivid'}
                        onChange={e => updateModelParameter(configModelId, 'style', e.target.value)}
                        disabled={isParamLocked(getModelById(configModelId), 'style')}
                        className={cn(
                          "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                          isParamLocked(getModelById(configModelId), 'style') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        )}
                      >
                        <option value="vivid">Vivid</option>
                        <option value="natural">Natural</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Background - shown for all models but only works with GPT-image-1 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Background
                      {isParamLocked(getModelById(configModelId), 'background') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <select
                      value={getModelById(configModelId)?.parameters.background || 'auto'}
                      onChange={e => updateModelParameter(configModelId, 'background', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'background') || getModelById(configModelId)?.parameters.model !== 'gpt-image-1'}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        (isParamLocked(getModelById(configModelId), 'background') || getModelById(configModelId)?.parameters.model !== 'gpt-image-1') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    >
                      <option value="auto">Auto</option>
                      <option value="transparent">Transparent</option>
                      <option value="opaque">Opaque</option>
                    </select>
                    {getModelById(configModelId)?.parameters.model !== 'gpt-image-1' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only supported for GPT-image-1 model
                      </p>
                    )}
                  </div>
                      
                  {/* Output Format - shown for all models but only works with GPT-image-1 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Output Format
                      {isParamLocked(getModelById(configModelId), 'output_format') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <select
                      value={getModelById(configModelId)?.parameters.output_format || 'png'}
                      onChange={e => updateModelParameter(configModelId, 'output_format', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'output_format') || getModelById(configModelId)?.parameters.model !== 'gpt-image-1'}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        (isParamLocked(getModelById(configModelId), 'output_format') || getModelById(configModelId)?.parameters.model !== 'gpt-image-1') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                    {getModelById(configModelId)?.parameters.model !== 'gpt-image-1' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only supported for GPT-image-1 model
                      </p>
                    )}
                  </div>
                      
                  {/* Moderation - shown for all models but only works with GPT-image-1 */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Moderation
                      {isParamLocked(getModelById(configModelId), 'moderation') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <select
                      value={getModelById(configModelId)?.parameters.moderation || 'auto'}
                      onChange={e => updateModelParameter(configModelId, 'moderation', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'moderation') || getModelById(configModelId)?.parameters.model !== 'gpt-image-1'}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        (isParamLocked(getModelById(configModelId), 'moderation') || getModelById(configModelId)?.parameters.model !== 'gpt-image-1') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    >
                      <option value="auto">Auto</option>
                      <option value="low">Low</option>
                    </select>
                    {getModelById(configModelId)?.parameters.model !== 'gpt-image-1' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only supported for GPT-image-1 model
                      </p>
                    )}
                  </div>
                      
                  {/* Output Compression - shown for all models but only works with GPT-image-1 and webp/jpeg formats */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Output Compression
                      {isParamLocked(getModelById(configModelId), 'output_compression') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={getModelById(configModelId)?.parameters.output_compression || 100}
                        onChange={e => updateModelParameter(
                          configModelId, 
                          'output_compression', 
                          parseInt(e.target.value)
                        )}
                        disabled={isParamLocked(getModelById(configModelId), 'output_compression') || 
                          getModelById(configModelId)?.parameters.model !== 'gpt-image-1' ||
                          (getModelById(configModelId)?.parameters.output_format !== 'webp' && 
                           getModelById(configModelId)?.parameters.output_format !== 'jpeg')}
                        className="flex-1"
                      />
                      <span className="text-sm w-12 text-right">
                        {getModelById(configModelId)?.parameters.output_compression || 100}%
                      </span>
                    </div>
                    {(getModelById(configModelId)?.parameters.model !== 'gpt-image-1' ||
                      (getModelById(configModelId)?.parameters.output_format !== 'webp' && 
                       getModelById(configModelId)?.parameters.output_format !== 'jpeg')) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only supported for GPT-image-1 model with WEBP or JPEG format
                      </p>
                    )}
                  </div>
                </>
              )}
              
              {/* Google Imagen specific parameters */}
              {getModelById(configModelId)?.apiEndpoint.includes('imagen') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Aspect Ratio
                      {isParamLocked(getModelById(configModelId), 'aspectRatio') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <select
                      value={getModelById(configModelId)?.parameters.aspectRatio || '1:1'}
                      onChange={e => updateModelParameter(configModelId, 'aspectRatio', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'aspectRatio')}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        isParamLocked(getModelById(configModelId), 'aspectRatio') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    >
                      <option value="1:1">Square (1:1)</option>
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                      <option value="4:3">Landscape (4:3)</option>
                      <option value="3:4">Portrait (3:4)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      Person Generation
                      {isParamLocked(getModelById(configModelId), 'personGeneration') && (
                        <Lock size={14} className="text-gray-400" />
                      )}
                    </label>
                    <select
                      value={getModelById(configModelId)?.parameters.personGeneration || 'ALLOW_ADULT'}
                      onChange={e => updateModelParameter(configModelId, 'personGeneration', e.target.value)}
                      disabled={isParamLocked(getModelById(configModelId), 'personGeneration')}
                      className={cn(
                        "w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white",
                        isParamLocked(getModelById(configModelId), 'personGeneration') && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      )}
                    >
                      <option value="ALLOW_ADULT">Allow Adults</option>
                      <option value="DONT_ALLOW">Don't Allow People</option>
                    </select>
                  </div>
                </>
              )}
              
              {/* Stability AI and other models with temperature */}
              {!getModelById(configModelId)?.apiEndpoint.includes('openai.com') && 
                getModelById(configModelId)?.parameters.temperature !== undefined && (
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    Temperature
                    {isParamLocked(getModelById(configModelId), 'temperature') && (
                      <Lock size={14} className="text-gray-400" />
                    )}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={getModelById(configModelId)?.parameters.temperature || 0.7}
                      onChange={e => updateModelParameter(
                        configModelId, 
                        'temperature', 
                        parseFloat(e.target.value)
                      )}
                      disabled={isParamLocked(getModelById(configModelId), 'temperature')}
                      className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">
                      {getModelById(configModelId)?.parameters.temperature?.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex justify-end sticky bottom-0 bg-white dark:bg-gray-900">
              <button
                onClick={closeModelConfig}
                className={cn(
                  "px-4 py-2 rounded-md font-medium",
                  "bg-black text-white hover:bg-gray-800",
                  "dark:bg-white dark:text-black dark:hover:bg-gray-200",
                  "transition-colors"
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 