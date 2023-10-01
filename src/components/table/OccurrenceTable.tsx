import { ProgressBar, Table } from "react-bootstrap";
import { OccurrenceRecord } from "../../model/OccurrenceRecord";
import OccurrenceAvailability from "./OccurrenceAvailability";
import { RedListCategory } from "../../constant/RedListCategory";

export default function OccurrenceTable({ isLoading, loadingState, records }: TableProps) {
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th># of occurrences</th>
            <th>Scientific name</th>
            <th>Generic name</th>
            <th>Red List category</th>
            <th>Availability</th>
            <th>Phylum</th>
            <th>Class</th>
            <th>Order</th>
            <th>Family</th>
            <th>Genus</th>
            <th>Species</th>
          </tr>
        </thead>
        <tbody>
          {!isLoading &&
            records.map(value => (
              <tr key={`occurrence-${value.occurrenceID}`}>
                <td>{value.numberOfOccurrences}</td>
                <td>
                  <a href={`https://www.google.com/search?q=${value.scientificName}`} target="_blank">
                    {value.scientificName}
                  </a>
                </td>
                <td>{value.genericName}</td>
                <td>
                  {value.iucnRedListCategory
                    ? `${RedListCategory[value.iucnRedListCategory]} (${value.iucnRedListCategory})`
                    : "—"}
                </td>
                <td>
                  <OccurrenceAvailability record={value} />
                </td>
                <td>{value.phylum}</td>
                <td>{value.class}</td>
                <td>{value.order}</td>
                <td>{value.family}</td>
                <td>{value.genus}</td>
                <td>{value.species}</td>
              </tr>
            ))}
        </tbody>
      </Table>
      <div className="text-center">
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
  loadingState: LoadingState;
  records: OccurrenceRecord[];
}

export interface LoadingState {
  fetched: number;
  total: number;
}
