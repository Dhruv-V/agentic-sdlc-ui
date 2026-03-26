```typescript
/**
 * MeetingTranscriptInput component for pasting meeting transcripts and initiating pipeline processing.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usePipelineStore } from '../state/pipelineStore';
import { useRunPipelineMutation } from '../api/pipelineApi';
import { useNavigate } from 'react-router-dom';

const transcriptSchema = z.string().min(1, 'Meeting transcript is required');

type TranscriptInputFormData = z.infer<typeof transcriptSchema>;

const MeetingTranscriptInput = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<TranscriptInputFormData>({
    resolver: z.zodResolver(transcriptSchema),
  });
  const [runPipeline, { isLoading }] = useRunPipelineMutation();
  const navigate = useNavigate();
  const pipelineStore = usePipelineStore();

  const handleRunPipeline = async (data: TranscriptInputFormData) => {
    await runPipeline(data);
    pipelineStore.initiatePipelineProcessing();
    navigate('/pipeline-status');
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-xl shadow-md">
      <h2 className="text-lg font-bold mb-4">Meeting Transcript Input</h2>
      <form onSubmit={handleSubmit(handleRunPipeline)} className="flex flex-col space-y-4">
        <textarea
          {...register('transcript')}
          className={`w-full p-2 border border-gray-400 rounded-md focus:outline-none focus:ring focus:ring-blue-500 ${errors.transcript ? 'border-red-500' : ''}`}
          placeholder="Paste meeting transcript here..."
          rows={10}
        />
        {errors.transcript && <div className="text-red-500">{errors.transcript.message}</div>}
        <button
          type="submit"
          disabled={isLoading}
          className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Running Pipeline...' : 'Run Pipeline'}
        </button>
      </form>
    </div>
  );
};

export default MeetingTranscriptInput;
```