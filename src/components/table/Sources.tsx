import { OccurrenceRecord } from "../../model/OccurrenceRecord";
import React, { useEffect, useState } from "react";
import { Dataset } from "../../model/Dataset";
import { GbifDatasetResponse } from "../../model/GbifDatasetResponse";
import { Document, Link, Page, PDFDownloadLink, StyleSheet, Text } from "@react-pdf/renderer";

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

// ${mapLatitude}_${mapLongitude}
const nameGetter = () => `gbif_sources_on_${new Date().toISOString().substring(0)}`.replace(/[:.\s-]/g, "_") + ".pdf";

async function getDatasetInfo(datasetKeys: Set<string>) {
  const cachedDatasets = new Set<Dataset>();
  const nonCachedKeys = new Set<string>();
  for (const datasetKey of datasetKeys) {
    const cachedDatasetInfo = sessionStorage.getItem(datasetKey);
    if (cachedDatasetInfo == null) {
      console.debug(`Cache miss for dataset ${datasetKey}`);
      nonCachedKeys.add(datasetKey);
    } else {
      console.debug(`Cache hit for dataset ${datasetKey}`);
      cachedDatasets.add(JSON.parse(cachedDatasetInfo) as Dataset);
    }
  }

  let result = Array.from(cachedDatasets);
  if (cachedDatasets.size !== datasetKeys.size) {
    const url =
      "https://api.gbif.org/v1/dataset?" + new URLSearchParams(Array.from(nonCachedKeys).map(k => ["identifier", k]));
    console.debug("GBIF request URL: ", url);

    const response = await fetch(url);
    const responseJson = (await response.json()) as GbifDatasetResponse;
    console.debug("GBIF response: ", responseJson);

    for (const datasetInfo of responseJson.results) {
      nonCachedKeys.delete(datasetInfo.key);
      sessionStorage.setItem(datasetInfo.key, JSON.stringify(datasetInfo));
    }

    result = result.concat(responseJson.results);
  }

  if (nonCachedKeys.size > 0) {
    for (const nonCachedKey of nonCachedKeys) {
      console.debug(`Will fetch dataset info for ${nonCachedKey}`);
      const url = `https://api.gbif.org/v1/dataset/${nonCachedKey}`;
      console.debug("GBIF request URL: ", url);

      const response = await fetch(url);
      const responseJson = (await response.json()) as Dataset;
      console.debug("GBIF response: ", responseJson);

      sessionStorage.setItem(nonCachedKey, JSON.stringify(responseJson));
      result.push(responseJson);
    }
  }

  result.sort((a, b) => a.title.localeCompare(b.title));

  return result;
}

export default function Sources({ records }: SourcesProps) {
  const datasetKeys = new Set(records.map(r => r.datasetKey));

  const [datasetInfo, setDatasetInfo] = useState<Dataset[] | null>(null);
  useEffect(() => {
    const checkAvailability = async () => {
      setDatasetInfo(await getDatasetInfo(datasetKeys));
    };

    console.debug("Will fetch dataset info");
    checkAvailability().catch((e: any) => console.error(`Error fetching dataset info`, e));
  }, [records]);

  return datasetInfo === null ? (
    <span />
  ) : (
    <>
      <ol style={{ overflow: "auto", paddingTop: "15px", height: "400px" }}>
        {datasetInfo.map(d => (
          <li key={d.key}>
            <a target="_blank" href={`https://www.gbif.org/dataset/${d.key}`}>
              {d.title}
            </a>{" "}
            - {d.citation.text}
          </li>
        ))}
      </ol>
      <hr />
      <div className="text-center mx-2" style={{ marginBottom: "15px" }}>
        <PDFDownloadLink
          fileName={nameGetter()}
          document={
            <Document>
              <Page size="A4" style={pdfStyles.body}>
                {datasetInfo.map((d, idx) => (
                  <Text key={d.key} style={pdfStyles.text}>
                    {idx + 1}. <Link href={`https://www.gbif.org/dataset/${d.key}`}>{d.title}</Link> - {d.citation.text}
                  </Text>
                ))}
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
    </>
  );
}

export interface SourcesProps {
  records: OccurrenceRecord[];
}
