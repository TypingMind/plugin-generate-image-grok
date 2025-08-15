async function grok_image_generator(params, userSettings, authorizedResources) {
  const prompt = params.prompt;
  const xaiApiKey = userSettings.xaiApiKey;
  const n = params.n || parseInt(userSettings.defaultImageCount) || 1;

  if (!xaiApiKey) {
    throw new Error(
      'No xAI API key provided to the Grok Image Generator plugin. Please enter your xAI API key in the plugin settings and try again.'
    );
  }

  // Validate parameters
  if (!prompt) {
    throw new Error('Prompt is required for image generation');
  }

  if (n < 1 || n > 4) {
    throw new Error('Number of images must be between 1 and 4');
  }

  // Prepare the API request with base64 response format
  const apiUrl = 'https://api.x.ai/v1/images/generations';
  
  const requestBody = {
    model: "grok-2-image",
    prompt: prompt,
    n: n,
    response_format: "b64_json"
  };

  try {
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // Check if response is ok
    if (response.status === 401) {
      throw new Error('Invalid xAI API Key. Please check your settings.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage += `: ${errorData.error}`;
        }
      } catch (e) {
        errorMessage += `: ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Parse the response
    const data = await response.json();

    // Check if we have valid image data
    if (!data.data || data.data.length === 0) {
      throw new Error('No images were generated. Please try again.');
    }

    // Create cards for each generated image
    const cards = data.data.map((image, index) => {
      if (!image.b64_json) {
        throw new Error(`Image ${index + 1} does not contain base64 data`);
      }

      return {
        type: 'image',
        image: {
          url: `data:image/jpeg;base64,${image.b64_json}`,
          alt: prompt.replace(/[\[\]]/g, ''),
          sync: true,
        },
      };
    });

    return {
      cards: cards
    };

  } catch (error) {
    // Re-throw the error to be handled by TypingMind
    throw error;
  }
}
