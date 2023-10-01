import { Form } from "react-bootstrap";
import { ChangeEventHandler } from "react";

export default function FilterControls({
  isEndangeredOnly,
  includePlants,
  includeFungi,
  onEndangeredOnlyChange,
  onIncludePlantsChange,
  onIncludeFungiChange,
}: FilterControlsProps) {
  return (
    <>
      <Form.Check
        id="endageneredOnlyCheckbox"
        label="Endangered only"
        type="switch"
        checked={isEndangeredOnly}
        onChange={onEndangeredOnlyChange}
      />
      <Form.Check id="plantsCheckbox" label="Plants" checked={includePlants} onChange={onIncludePlantsChange} />
      <Form.Check id="fungiCheckbox" label="Fungi" checked={includeFungi} onChange={onIncludeFungiChange} />
    </>
  );
}

export interface FilterControlsProps extends FilterControlsState {
  onEndangeredOnlyChange: ChangeEventHandler<HTMLInputElement>;
  onIncludePlantsChange: ChangeEventHandler<HTMLInputElement>;
  onIncludeFungiChange: ChangeEventHandler<HTMLInputElement>;
}

export interface FilterControlsState {
  isEndangeredOnly: boolean;
  includePlants: boolean;
  includeFungi: boolean;
}
