async function grok_image_generator(params, userSettings) {
  // Validate API key
  if (!userSettings.xaiApiKey) {
    return 'Error: xAI API key is required. Please set it in User Settings.';
  }

  // Extract parameters with defaults
  const prompt = params.prompt;
  const n = params.n || parseInt(userSettings.defaultImageCount) || 1;

  // Validate parameters
  if (!prompt) {
    return 'Error: Prompt is required for image generation';
  }

  if (n < 1 || n > 4) {
    return 'Error: Number of images must be between 1 and 4';
  }

  // Prepare the API request (removed size parameter as it's not supported)
  const apiUrl = 'https://api.x.ai/v1/images/generations';
  
  const requestBody = {
    model: "grok-2-image",
    prompt: prompt,
    n: n
  };

  try {
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSettings.xaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // Get response text first to see what we received
    const responseText = await response.text();

    // Check if response is ok
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          errorMessage += `: ${errorData.error}`;
        }
      } catch (e) {
        errorMessage += `: ${responseText}`;
      }
      
      return `Error: ${errorMessage}`;
    }

    // Parse the response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return `Error: Invalid JSON response: ${responseText}`;
    }

    // Format the output
    if (data.data && data.data.length > 0) {
      let output = `Successfully generated ${data.data.length} image(s) for prompt: "${prompt}"\n\n`;
      
      data.data.forEach((image, index) => {
        if (image.url) {
          output += `**Image ${index + 1}:**\n`;
          output += `![Generated Image ${index + 1}](${image.url})\n`;
          output += `[Direct Link](${image.url})\n\n`;
        } else if (image.b64_json) {
          // Handle base64 encoded images if returned
          output += `**Image ${index + 1}:** (Base64 encoded - display not supported in markdown)\n\n`;
        }
      });

      // Add metadata if available
      if (data.created) {
        const date = new Date(data.created * 1000);
        output += `\n---\n*Generated at: ${date.toLocaleString()}*`;
      }

      return output;
    } else {
      return `Error: No images were generated. Response: ${responseText}`;
    }

  } catch (error) {
    return `Error: Network or fetch error: ${error.message}`;
  }
}

