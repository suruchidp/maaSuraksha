import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatCapabilities, generateGroundedAnswer } from '../src/services/chatProvider';
const input={question:'Diet ideas?',language:'en',context:'',resources:'Choose varied foods.',sources:[{title:'NHS',url:'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/'}]};
const response=(answer:unknown,status='completed')=>new Response(JSON.stringify({status,output:[{content:[{type:'output_text',text:JSON.stringify(answer)}]}]}),{status:200});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('optional grounded AI provider',()=>{
 it('requires explicit provider, key and model configuration',()=>{vi.stubEnv('CHAT_PROVIDER','local');expect(chatCapabilities().externalAiAvailable).toBe(false);vi.stubEnv('CHAT_PROVIDER','openai');vi.stubEnv('OPENAI_API_KEY','qa-only');vi.stubEnv('CHAT_MODEL','qa-model');expect(chatCapabilities().externalAiAvailable).toBe(true);expect(JSON.stringify(chatCapabilities())).not.toContain('qa-only');});
 it('uses Responses structured output with store false, a fixed endpoint, no tools and no conversation history',async()=>{
  vi.stubEnv('OPENAI_API_KEY','qa-only');vi.stubEnv('CHAT_MODEL','qa-model');const fetch=vi.fn().mockResolvedValue(response({supported:true,answer:'Choose a variety of foods.',sourceIndices:[0]}));vi.stubGlobal('fetch',fetch);
  expect(await generateGroundedAnswer(input)).toBe('Choose a variety of foods.');const [url,request]=fetch.mock.calls[0];expect(url).toBe('https://api.openai.com/v1/responses');const body=JSON.parse(request.body);expect(body.store).toBe(false);expect(body.text.format.strict).toBe(true);expect(body.text.format.type).toBe('json_schema');expect(body.tools).toBeUndefined();expect(body.previous_response_id).toBeUndefined();expect(JSON.parse(body.input)).toEqual(input);expect(request.signal).toBeInstanceOf(AbortSignal);
 });
 it('rejects unsupported or out-of-range citations and malformed JSON',async()=>{
  for(const value of [{supported:false,answer:'Unknown',sourceIndices:[]},{supported:true,answer:'Answer',sourceIndices:[9]},{supported:true,answer:'Answer',sourceIndices:[]},{answer:'Missing schema fields'}]) {vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response(value)));await expect(generateGroundedAnswer(input)).rejects.toThrow();}
 });
 it('rejects conspicuous diagnoses, medication doses and false reassurance',async()=>{
  for(const answer of ['You have diabetes.','Take 50 mg today.','It is completely safe.','Stop taking your treatment.']) {vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response({supported:true,answer,sourceIndices:[0]})));await expect(generateGroundedAnswer(input)).rejects.toThrow();}
 });
 it('rejects incomplete, failed and timed-out provider responses',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response({supported:true,answer:'Answer',sourceIndices:[0]},'incomplete')));await expect(generateGroundedAnswer(input)).rejects.toThrow('incomplete');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('down',{status:503})));await expect(generateGroundedAnswer(input)).rejects.toThrow('unavailable');
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('Timeout','TimeoutError')));await expect(generateGroundedAnswer(input)).rejects.toThrow('Timeout');
 });
});
