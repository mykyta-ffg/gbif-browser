import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import React from "react";

export default function Popup({ children, label, disabled }: PopupProps) {
  return (
    <OverlayTrigger
      trigger="click"
      placement="top"
      overlay={
        <Popover id={`${label}-popover`} title={label} style={{ maxHeight: "500px", maxWidth: "750px" }}>
          {children}
        </Popover>
      }
      rootClose
    >
      <Button className="m-2" variant="light" disabled={disabled}>
        {label}
      </Button>
    </OverlayTrigger>
  );
}

export interface PopupProps extends React.PropsWithChildren {
  label: string;
  disabled: boolean;
}
