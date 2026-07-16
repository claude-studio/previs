import type { DataModelBlock as DataModelBlockData } from '@previs/schema';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataModelBlock } from './DataModelBlock';

function dataModelBlock(overrides: Partial<DataModelBlockData> = {}): DataModelBlockData {
  return {
    id: 'dm-test',
    type: 'data-model',
    entities: [
      {
        name: 'Document',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'kind', type: 'plan | recap', note: '문서 종류', inferred: true },
        ],
      },
      {
        name: 'Block',
        inferred: true,
        fields: [{ name: 'id', type: 'string' }],
      },
    ],
    relations: [{ from: 'Document', to: 'Block', kind: '1-n', label: 'contains' }],
    ...overrides,
  };
}

describe('DataModelBlock', () => {
  it('renders entity cards with field rows and notes', () => {
    render(<DataModelBlock block={dataModelBlock()} />);

    expect(screen.getByRole('heading', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByText('plan | recap')).toBeInTheDocument();
    expect(screen.getByText('문서 종류')).toBeInTheDocument();
    expect(screen.getByText('2개 엔티티')).toBeInTheDocument();
  });

  it('shows inferred badges for inferred fields and entities', () => {
    render(<DataModelBlock block={dataModelBlock()} />);

    expect(screen.getAllByText('추론됨')).toHaveLength(2);
  });

  it('hides the evidence column when no field is inferred', () => {
    render(
      <DataModelBlock
        block={dataModelBlock({
          entities: [{ name: 'Plain', fields: [{ name: 'id', type: 'string' }] }],
          relations: undefined,
        })}
      />,
    );

    expect(screen.queryByText('근거')).not.toBeInTheDocument();
  });

  it('renders relations with kind badge and label', () => {
    render(<DataModelBlock block={dataModelBlock()} />);

    expect(screen.getByText('관계')).toBeInTheDocument();
    expect(screen.getByText('1-n')).toBeInTheDocument();
    expect(screen.getByText('contains')).toBeInTheDocument();
  });

  it('omits the relations section when relations are absent', () => {
    render(<DataModelBlock block={dataModelBlock({ relations: undefined })} />);

    expect(screen.queryByText('관계')).not.toBeInTheDocument();
  });
});
