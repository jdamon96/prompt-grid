import Link from "next/link";

export default function ApiKeysInfoPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">How Prompt Grid Handles Your API Keys</h1>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        Prompt Grid is designed with security and privacy in mind. Here's exactly how your API keys are handled when you use the app:
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. API Keys Stay in Your Browser</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
        <li>Your API keys are <b>never stored on our server</b> or in any database.</li>
        <li>They are only kept in your browser's memory for the duration of your session.</li>
        <li>When you generate an image, your API key is sent <b>only for that request</b> via a secure local API route.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. Frontend: Sending Your API Key</h2>
      <p className="mb-2 text-gray-700 dark:text-gray-300">
        When you click "Generate", the API key is sent to the backend <b>only for the current request</b>. It is never persisted or logged. See the relevant code:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs overflow-x-auto mb-2">
{`body: JSON.stringify({
  apiEndpoint: model.apiEndpoint,
  apiKey: model.apiKey, // Key is sent to our proxy but not stored there
  prompt: prompt.text,
  parameters: model.parameters,
  modelName: model.name
})`}
      </pre>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        <a
          href="https://github.com/jdamon96/prompt-grid/blob/main/components/PromptGrid.tsx#L377-L689"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline"
        >
          View frontend code on GitHub
        </a>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Backend: Proxying Your Request</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
        <li>The backend receives your API key and <b>forwards it to the third-party API</b> (OpenAI, Google, etc).</li>
        <li><b>No API keys are ever logged or stored</b> on the server.</li>
        <li>All logs and debugging info <b>explicitly avoid</b> including your API key.</li>
      </ul>
      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs overflow-x-auto mb-2">
{`let headers: RequestHeaders = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer \${apiKey}'
};
// ...
// No logging of apiKey, only used for this request
`}
      </pre>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        <a
          href="https://github.com/jdamon96/prompt-grid/blob/main/app/api/proxy/route.ts#L31-L368"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline"
        >
          View backend proxy code on GitHub
        </a>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Summary</h2>
      <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300">
        <li>Your API keys are <b>never stored</b> or logged by Prompt Grid.</li>
        <li>They are used <b>only for the specific image generation request</b> you make.</li>
        <li>All code is open source and <a href="https://github.com/jdamon96/prompt-grid" target="_blank" rel="noopener noreferrer" className="underline">auditable on GitHub</a>.</li>
      </ul>
    </div>
  );
} 