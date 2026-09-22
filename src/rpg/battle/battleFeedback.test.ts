import { describe, expect, it } from 'vitest';
import { captureShakeCount, feedbackDuration } from './battleFeedback';

describe('战斗反馈节拍',()=>{
  it('成功固定三次摇晃，失败越接近阈值挣扎越久',()=>{
    expect(captureShakeCount(.1,.5,true)).toBe(3);
    expect(captureShakeCount(.62,.5,false)).toBe(3);
    expect(captureShakeCount(.82,.5,false)).toBe(2);
    expect(captureShakeCount(.96,.5,false)).toBe(1);
  });

  it('锁定与挣脱保留比普通命中更长的可见时间',()=>{
    const hit=feedbackDuration({kind:'attack',actor:'ally',element:'fire',amount:12});
    expect(feedbackDuration({kind:'capture',phase:'success'})).toBeGreaterThan(hit);
    expect(feedbackDuration({kind:'capture',phase:'break'})).toBeGreaterThan(hit);
    expect(feedbackDuration({kind:'capture',phase:'throw'})).toBeGreaterThanOrEqual(1200);
    expect(feedbackDuration({kind:'capture',phase:'shake',shake:3})).toBeGreaterThan(feedbackDuration({kind:'capture',phase:'shake',shake:1}));
  });
});
