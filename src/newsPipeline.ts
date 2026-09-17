import {LiveHeadline} from './liveNews';
import {fetchSourceContent,NewsSourceContent} from './newsSource';
import {explainHeadline,NewsExplanation} from './newsExplanation';

export type NewsPipelineResult={
  headline:LiveHeadline;
  sourceContent:NewsSourceContent|null;
  explanation:NewsExplanation;
  verifiedSource:boolean;
};

/**
 * Builds a detail payload without inventing facts. The mobile app can use this
 * immediately; a future server-side AI summarizer can replace the explanation
 * mapper once a secure backend is available.
 */
export async function buildNewsPipeline(headline:LiveHeadline):Promise<NewsPipelineResult>{
  const sourceContent=await fetchSourceContent(headline.url);

  if(!sourceContent){
    return{
      headline,
      sourceContent:null,
      explanation:explainHeadline(headline),
      verifiedSource:false,
    };
  }

  const enriched:LiveHeadline={
    ...headline,
    title:sourceContent.title||headline.title,
    description:sourceContent.text.slice(0,5000),
    source:sourceContent.source||headline.source,
  };

  return{
    headline:enriched,
    sourceContent,
    explanation:explainHeadline(enriched),
    verifiedSource:true,
  };
}
