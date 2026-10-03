// Extension point for the next phase:
// - stream camera/video frames to Gemini Live
// - ask Gemini to describe objects, scenes, text, and events
// - optionally switch responseModalities to AUDIO for spoken analysis
export class VisualAnalysis { start() { throw new Error('Visual analysis is not enabled yet.'); } }
