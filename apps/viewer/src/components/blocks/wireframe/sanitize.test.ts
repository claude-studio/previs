import { describe, expect, it } from 'vitest';

import { ALLOWED_ATTR, ALLOWED_TAGS, sanitizeWireframeHtml } from './sanitize';

describe('sanitize policy constants', () => {
  it('never allows executable or embedding tags', () => {
    const tags: readonly string[] = ALLOWED_TAGS;
    for (const forbidden of ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math']) {
      expect(tags).not.toContain(forbidden);
    }
  });

  it('never allows presentation, geometry, or resource attributes', () => {
    const attrs: readonly string[] = ALLOWED_ATTR;
    for (const forbidden of [
      'style',
      'class',
      'width',
      'height',
      'src',
      'href',
      'action',
      'formaction',
      'background',
      'coords',
    ]) {
      expect(attrs).not.toContain(forbidden);
    }
  });
});

describe('sanitizeWireframeHtml', () => {
  it('keeps allowlisted semantic structure', () => {
    const result = sanitizeWireframeHtml(
      '<main><header><h1>제목</h1></header><section><p>본문</p></section></main>',
    );
    expect(result).toContain('<main>');
    expect(result).toContain('<h1>제목</h1>');
    expect(result).toContain('<p>본문</p>');
  });

  it('removes script and iframe content entirely', () => {
    expect(sanitizeWireframeHtml('<script>alert(1)</script>')).toBe('');
    const result = sanitizeWireframeHtml('<p>안전</p><iframe title="x"></iframe>');
    expect(result).not.toContain('iframe');
    expect(result).toContain('<p>안전</p>');
  });

  it('strips event handlers, style, and class attributes', () => {
    const result = sanitizeWireframeHtml(
      '<section class="grid" style="width:400px" onclick="alert(1)"><p>내용</p></section>',
    );
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('style=');
    expect(result).not.toContain('class="grid"');
  });

  it('strips navigation, resource, and geometry attributes outside the allowlist', () => {
    const result = sanitizeWireframeHtml(
      '<form action="/submit"><button formaction="/x" type="submit">전송</button></form>' +
        '<table width="400" height="200" background="x.png"><tbody><tr><td coords="1,2">셀</td></tr></tbody></table>' +
        '<a href="https://example.com">링크</a><div data-layout="grid">박스</div>',
    );
    for (const attribute of [
      'action=',
      'formaction=',
      'width=',
      'height=',
      'background=',
      'coords=',
      'href=',
      'data-layout=',
    ]) {
      expect(result).not.toContain(attribute);
    }
    expect(result).toContain('링크');
  });

  it('keeps allowlisted structural attributes', () => {
    const result = sanitizeWireframeHtml(
      '<label for="q">의견</label><input id="q" type="text" placeholder="입력">' +
        '<table><tbody><tr><td colspan="2">병합 셀</td></tr></tbody></table>',
    );
    expect(result).toContain('for="q"');
    expect(result).toContain('placeholder="입력"');
    expect(result).toContain('colspan="2"');
  });

  it('forces form controls to disabled', () => {
    const result = sanitizeWireframeHtml(
      '<form><input type="text"><textarea></textarea><select><option>a</option></select><button type="submit">전송</button></form>',
    );
    expect(result.match(/disabled/g)).toHaveLength(4);
  });

  it('replaces images with an alt-text placeholder', () => {
    const result = sanitizeWireframeHtml('<img src="https://example.com/x.png" alt="미리보기">');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('src=');
    expect(result).toContain('wf-image-placeholder');
    expect(result).toContain('미리보기');
  });

  it('uses a default label for images without alt text', () => {
    const result = sanitizeWireframeHtml('<figure><img></figure>');
    expect(result).toContain('이미지 자리표시자');
  });

  it('returns an empty string when nothing survives', () => {
    expect(sanitizeWireframeHtml('<script>x</script><style>p{}</style>')).toBe('');
  });
});
