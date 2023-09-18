import { Form } from "react-bootstrap";
import { ChangeEventHandler } from "react";

export default function Filter({
  isEndangeredOnly,
  includePlants,
  includeFungi,
  onEndangeredOnlyChange,
  onIncludePlantsChange,
  onIncludeFungiChange,
}: FilterProps) {
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

export interface FilterProps extends FilterState {
  onEndangeredOnlyChange: ChangeEventHandler<HTMLInputElement>;
  onIncludePlantsChange: ChangeEventHandler<HTMLInputElement>;
  onIncludeFungiChange: ChangeEventHandler<HTMLInputElement>;
}

export interface FilterState {
  isEndangeredOnly: boolean;
  includePlants: boolean;
  includeFungi: boolean;
}
