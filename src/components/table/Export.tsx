import React from "react";
import { OccurrenceRecord } from "../../model/OccurrenceRecord";
import { Document, Page, PDFDownloadLink, StyleSheet, Text } from "@react-pdf/renderer";
import { Button, Col, OverlayTrigger, Row, Tooltip } from "react-bootstrap";

const pdfStyles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  text: {
    margin: 12,
    fontSize: 14,
    textAlign: "justify",
    fontFamily: "Times-Roman",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },
});

const nameGetter = () =>
  `gbif_search_results_on_${new Date().toISOString().substring(0)}`.replace(/[:.\s-]/g, "_") + ".pdf";

const CHATGPT_TRIM_PATTERN = / (?:subsp\.|\().+/;

export default function Export({ records }: CsvExportProps) {
  const chatGptText = records.reduce(
    (acc, r, idx) =>
      (acc += `${idx + 1},${r.scientificName.replace(CHATGPT_TRIM_PATTERN, "")},${r.iucnRedListCategory}\n`),
    "",
  );

  return (
    <>
      <div style={{ overflow: "auto", padding: "15px", height: "400px" }}>
        <div># of occurrences,Scientific name,IUCN status</div>
        {records.map(r => (
          <div key={`row-${r.key}`}>
            {r.numberOfOccurrences},{r.scientificName},{r.iucnRedListCategory}
          </div>
        ))}
      </div>
      <hr />
      <Row>
        <Col className="text-center" style={{ marginBottom: "15px", marginLeft: "25px" }}>
          <OverlayTrigger trigger="click" placement="top" overlay={<Tooltip>Copied ✓</Tooltip>} rootClose>
            <Button size="sm" variant="outline-primary" onClick={() => navigator.clipboard.writeText(chatGptText)}>
              Copy for ChatGPT
            </Button>
          </OverlayTrigger>
        </Col>
        <Col>
          <div className="text-center" style={{ padding: "5px" }}>
            <PDFDownloadLink
              fileName={nameGetter()}
              document={
                <Document>
                  <Page size="A4" style={pdfStyles.body}>
                    <Text style={pdfStyles.text}>
                      # of occurrences,Scientific name,IUCN status
                      <br />
                      <br />
                      {records.map(r => `${r.numberOfOccurrences},${r.scientificName},${r.iucnRedListCategory}\n`)}
                    </Text>
                    <Text
                      style={pdfStyles.pageNumber}
                      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                      fixed
                    />
                  </Page>
                </Document>
              }
            >
              Export to PDF
            </PDFDownloadLink>
          </div>
        </Col>
      </Row>
    </>
  );
}

export interface CsvExportProps {
  records: OccurrenceRecord[];
}
