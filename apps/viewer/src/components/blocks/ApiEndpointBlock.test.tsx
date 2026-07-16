import type { ApiEndpointBlock as ApiEndpointBlockData } from '@previs/schema';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApiEndpointBlock } from './ApiEndpointBlock';

function apiEndpointBlock(
  overrides: Partial<ApiEndpointBlockData> = {},
): ApiEndpointBlockData {
  return {
    id: 'api-test',
    type: 'api-endpoint',
    method: 'POST',
    path: '/documents',
    summary: '문서를 발행합니다.',
    request: {
      body: [
        { name: 'title', type: 'string', required: true },
        { name: 'note', type: 'string' },
      ],
    },
    responses: [
      {
        status: 201,
        note: '생성된 문서',
        body: [{ name: 'id', type: 'string', required: true, inferred: true }],
      },
      { status: 400, note: '검증 실패' },
    ],
    ...overrides,
  };
}

describe('ApiEndpointBlock', () => {
  it('renders method badge, path and summary', () => {
    render(<ApiEndpointBlock block={apiEndpointBlock()} />);

    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/documents')).toBeInTheDocument();
    expect(screen.getByText('문서를 발행합니다.')).toBeInTheDocument();
  });

  it('marks required and optional request fields', () => {
    render(<ApiEndpointBlock block={apiEndpointBlock()} />);

    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(screen.getAllByText('필수')).not.toHaveLength(0);
    expect(screen.getByText('선택')).toBeInTheDocument();
  });

  it('renders every response with status, note and body fields', () => {
    render(<ApiEndpointBlock block={apiEndpointBlock()} />);

    expect(screen.getByText('201')).toBeInTheDocument();
    expect(screen.getByText('생성된 문서')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('검증 실패')).toBeInTheDocument();
    expect(screen.getByText('추론됨')).toBeInTheDocument();
  });

  it('omits the request section when the block has none', () => {
    render(<ApiEndpointBlock block={apiEndpointBlock({ request: undefined })} />);

    expect(screen.queryByText('요청')).not.toBeInTheDocument();
    expect(screen.getByText('응답')).toBeInTheDocument();
  });

  it('shows the endpoint-level inferred badge', () => {
    render(
      <ApiEndpointBlock
        block={apiEndpointBlock({ inferred: true, request: undefined, responses: [{ status: 200 }] })}
      />,
    );

    expect(screen.getByText('추론됨')).toBeInTheDocument();
  });
});
