import { Button, ButtonGroup, ButtonToolbar, Col, Form, Row } from "react-bootstrap";
import { ChangeEventHandler } from "react";

export default function MapControls({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  onRadiusChange,
  onDrawRectangle,
  onCenter,
  drawingEnabled,
}: MapControlsProps) {
  return (
    <Form>
      <Form.Group as={Row} className="mb-2">
        <Form.Label column sm="4">
          Latitude
        </Form.Label>
        <Col sm="8">
          <Form.Control value={latitude} onChange={onLatitudeChange} min={-90} max={90} />
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-2">
        <Form.Label column sm="4">
          Longitude
        </Form.Label>
        <Col sm="8">
          <Form.Control value={longitude} onChange={onLongitudeChange} min={-180} max={180} />
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-3">
        <Form.Label column sm="4">
          Radius, km
        </Form.Label>
        <Col sm="8">
          <Form.Control defaultValue={10} onChange={onRadiusChange} />
        </Col>
      </Form.Group>
      <ButtonToolbar className="d-flex justify-content-between">
        <ButtonGroup>
          <Button disabled={!drawingEnabled} size="sm" variant="outline-primary" onClick={onDrawRectangle}>
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
  drawingEnabled: boolean;
}

export interface MapControlsState {
  latitude: number;
  longitude: number;
}
