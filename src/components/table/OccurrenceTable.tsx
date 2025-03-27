import { ProgressBar, Table } from "react-bootstrap";
import { OccurrenceRecord } from "../../model/OccurrenceRecord";
import { useEffect, useState } from "react";
import { WikipediaSearchResponse } from "../../model/WikipediaSearchResponse";
import { WikipediaPageResponse } from "../../model/WikipediaPageResponse";
import { GbifOccurrenceResponseResult } from "../../model/GbifOccurrenceResponseResult";
import { OccurrenceRecordInfo } from "../../model/OccurrenceRecordInfo";
import OccurrenceInfo from "./OccurrenceInfo";
import OccurrenceAvailability from "./OccurrenceAvailability";

const WIKI_API = "https://en.wikipedia.org/w/api.php?";
const WIKI_REST_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const ENGLISH_NAME_REGEXPS = [
  /(?:(?:commonly )?known(?: commonly)? as(?: the)?|common name is|common names includ(?:e|ing)|common names usually include the terms|common names?|(?:commonly)? called) ([A-Z-']+(?:\s\w{4,})?)/i,
  /\(([a-zA-Z-' ]+)\)\s?(?:is|are|,)/,
  /, the ([a-zA-Z-' ]+) or [a-zA-Z-' ]+,/,
  /, the ([a-zA-Z-' ]+),/,
  /, or ([a-zA-Z-' ]+),/,
  / or ([a-zA-Z-' ]+) is/,
  /^([a-zA-Z-' ]{1,30})\s?(?:is|are|,)/,
];

async function fetchInfo(query: string) {
  const searchUrl =
    WIKI_API +
    new URLSearchParams([
      ["srsearch", query],
      ["srlimit", "1"],
      ["action", "query"],
      ["format", "json"],
      ["list", "search"],
      ["origin", "*"],
    ]);
  console.debug("Wikipedia search request URL: ", searchUrl);

  const searchResponse = await fetch(searchUrl);
  const searchResponseJson = (await searchResponse.json()) as WikipediaSearchResponse;
  console.debug("Wikipedia search response: ", searchResponseJson);

  if (searchResponseJson.query.search.length) {
    const firstSearchResult = searchResponseJson.query.search[0];
    const pageUrl = WIKI_REST_API + firstSearchResult.title;
    console.debug("Wikipedia page request URL: ", pageUrl);

    const pageResponse = await fetch(pageUrl);
    const pageResponseJson = (await pageResponse.json()) as WikipediaPageResponse;
    console.debug("Wikipedia page response: ", pageResponseJson);

    let match = null;
    for (let i = 0; i < ENGLISH_NAME_REGEXPS.length && match === null; ++i) {
      const regexp = ENGLISH_NAME_REGEXPS[i];
      match = regexp.exec(pageResponseJson.extract);
    }
    if (match != null) {
      console.debug(`Guessing english name of '${query}' as '${match[1]}'`);
    }

    return {
      englishName: match ? match[1][0].toUpperCase() + match[1].slice(1) : firstSearchResult.title,
      image: pageResponseJson.thumbnail?.source,
      summary: pageResponseJson.extract,
    };
  }

  return null;
}

async function getInfo(record: GbifOccurrenceResponseResult) {
  const key = `${record.taxonKey}-info`;
  const scientificName = record.scientificName;
  const cachedInfo = JSON.parse(sessionStorage.getItem(key) ?? "{}") as OccurrenceRecordInfo;
  if (Object.keys(cachedInfo).length) {
    console.debug(`Cache hit for ${scientificName} (${key})`);
  } else {
    console.debug(`Cache miss for ${scientificName} (${key})`);

    const info = record.genericName ? await fetchInfo(record.scientificName) : null;

    if (info !== null) {
      sessionStorage.setItem(key, JSON.stringify(info));
    }

    return info;
  }

  return cachedInfo;
}

export default function OccurrenceTable({ isLoading, showFullInfo, filterQuery, loadingState, records }: TableProps) {
  const [infoByTaxonKey, setInfoByTaxonKey] = useState<Map<number, OccurrenceRecordInfo | null>>(new Map());
  useEffect(() => {
    Promise.all(records.map(r => getInfo(r))).then(infos => {
      const infoByTaxonKeyCopy = new Map(infoByTaxonKey);
      for (let i = 0; i < infos.length; ++i) {
        const info = infos[i];
        const record = records[i];

        infoByTaxonKeyCopy.set(record.taxonKey, info);
      }

      setInfoByTaxonKey(infoByTaxonKeyCopy);
    });
  }, [records]);

  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th># of occurrences</th>
            <th>Scientific name</th>
            <th>English name</th>
            <th>Red List category</th>
            <th>Availability</th>
            <th className="text-center">Summary</th>
          </tr>
        </thead>
        <tbody>
          {!isLoading &&
            records
              .filter(
                value =>
                  !filterQuery ||
                  infoByTaxonKey.get(value.taxonKey)?.summary?.toUpperCase().includes(filterQuery.toUpperCase()),
              )
              .map((value, idx) => (
                <tr key={`occurrence-${idx}-${value.occurrenceID}`}>
                  <td>{value.numberOfOccurrences}</td>
                  <td>
                    <a href={`https://www.google.com/search?q=${value.scientificName}`} target="_blank">
                      {value.scientificName}
                    </a>
                  </td>
                  <td>{value.genericName}</td>
                  <td>{value.iucnRedListCategory ? `${value.iucnRedListCategory}` : "—"}</td>
                  <td>
                    <OccurrenceAvailability record={value} />
                  </td>
                  <td style={{ display: "flex", justifyContent: "center" }}>
                    <>
                      {infoByTaxonKey.has(value.taxonKey) ? (
                        infoByTaxonKey.get(value.taxonKey) === null ? (
                          "—"
                        ) : (
                          <OccurrenceInfo info={infoByTaxonKey.get(value.taxonKey)!} showFullInfo={showFullInfo} />
                        )
                      ) : (
                        "Loading..."
                      )}
                    </>
                  </td>
                </tr>
              ))}
        </tbody>
      </Table>
      <div className="text-center" style={{ marginBottom: "75px" }}>
        {isLoading ? (
          <ProgressBar
            animated
            now={(loadingState.fetched * 100) / loadingState.total}
            label={loadingState.fetched ? `Fetched ${loadingState.fetched} of ${loadingState.total} records` : ""}
          />
        ) : (
          !records.length && "No data"
        )}
      </div>
    </>
  );
}

export interface TableProps {
  isLoading: boolean;
  showFullInfo: boolean;
  filterQuery?: string;
  loadingState: LoadingState;
  records: OccurrenceRecord[];
}

export interface LoadingState {
  fetched: number;
  total: number;
}
