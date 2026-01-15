'use server';

/**
 * @fileOverview An AI-powered image optimization flow.
 *
 * - optimizeImageWithAI - A function that optimizes an image using AI.
 * - OptimizeImageWithAIInput - The input type for the optimizeImageWithAI function.
 * - OptimizeImageWithAIOutput - The return type for the optimizeImageWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeImageWithAIInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to optimize, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OptimizeImageWithAIInput = z.infer<typeof OptimizeImageWithAIInputSchema>;

const OptimizeImageWithAIOutputSchema = z.object({
  optimizedPhotoDataUri: z
    .string()
    .describe(
      'The optimized photo, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
  optimizationDetails: z
    .string()
    .describe('Details about the optimization process and the resulting quality and file size.'),
});
export type OptimizeImageWithAIOutput = z.infer<typeof OptimizeImageWithAIOutputSchema>;

export async function optimizeImageWithAI(input: OptimizeImageWithAIInput): Promise<OptimizeImageWithAIOutput> {
  return optimizeImageWithAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeImageWithAIPrompt',
  input: {schema: OptimizeImageWithAIInputSchema},
  output: {schema: OptimizeImageWithAIOutputSchema},
  prompt: `You are an AI-powered image optimization tool. Your goal is to optimize the given image for web use, balancing file size and visual quality.

  Analyze the image and determine the best compression level and quality settings to reduce the file size without significantly impacting the visual appearance.
  Return the optimized image as a data URI and provide details about the optimization process, including the original and optimized file sizes and any changes made to the image quality or format.

  Image: {{media url=photoDataUri}}
  \nMake sure to respond using ONLY the JSON format. Do not include any other text. The output schema is:
  ${JSON.stringify(OptimizeImageWithAIOutputSchema.shape)}`,
});

const optimizeImageWithAIFlow = ai.defineFlow(
  {
    name: 'optimizeImageWithAIFlow',
    inputSchema: OptimizeImageWithAIInputSchema,
    outputSchema: OptimizeImageWithAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
