import { Button, ButtonGroup, ButtonToolbar, Col, Form, Row } from "react-bootstrap";
import { ChangeEventHandler } from "react";

export default function MapControls({
  defaultLatitude,
  defaultLongitude,
  onLatitudeChange,
  onLongitudeChange,
  onRadiusChange,
  onDrawRectangle,
  onCenter,
}: MapControlsProps) {
  return (
    <Form>
      <Form.Group as={Row} className="mb-2">
        <Form.Label column sm="4">
          Latitude
        </Form.Label>
        <Col sm="8">
          <Form.Control
            defaultValue={defaultLatitude}
            onChange={onLatitudeChange}
            type="number"
            min={-90}
            max={90}
            step=".001"
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-2">
        <Form.Label column sm="4">
          Longitude
        </Form.Label>
        <Col sm="8">
          <Form.Control
            defaultValue={defaultLongitude}
            onChange={onLongitudeChange}
            type="number"
            min={-180}
            max={180}
            step=".001"
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm="4">
          Radius, km
        </Form.Label>
        <Col sm="8">
          <Form.Control defaultValue={10} onChange={onRadiusChange} type="number" />
        </Col>
      </Form.Group>
      <ButtonToolbar className="d-flex justify-content-between">
        <ButtonGroup>
          <Button size="sm" variant="outline-primary" onClick={onDrawRectangle}>
            Draw rectangle
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button size="sm" variant="outline-secondary" onClick={onCenter}>
            Center view
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    </Form>
  );
}

export interface MapControlsProps extends MapControlsState {
  onLatitudeChange: ChangeEventHandler<HTMLInputElement>;
  onLongitudeChange: ChangeEventHandler<HTMLInputElement>;
  onRadiusChange: ChangeEventHandler<HTMLInputElement>;
  onCenter: () => void;
  onDrawRectangle: () => void;
}

export interface MapControlsState {
  defaultLatitude: number;
  defaultLongitude: number;
}
