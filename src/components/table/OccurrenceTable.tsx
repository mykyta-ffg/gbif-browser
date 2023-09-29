import { Spinner, Table } from "react-bootstrap";
import { OccurrenceRecord } from "../../model/OccurrenceRecord";
import OccurrenceAvailability from "./OccurrenceAvailability";

export default function OccurrenceTable({ isLoading, records }: TableProps) {
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th># of occurrences</th>
            <th>Scientific name</th>
            <th>Generic name</th>
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
            records.map((value, idx) => (
              <tr key={`occurrence-${idx}`}>
                <td>{value.numberOfOccurrences}</td>
                <td>
                  <a href={`https://www.google.com/search?q=${value.scientificName}`} target="_blank">
                    {value.scientificName}
                  </a>
                </td>
                <td>{value.genericName}</td>
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
      <div className="text-center">{isLoading ? <Spinner /> : !records.length && "No data"}</div>
    </>
  );
}

export interface TableProps {
  isLoading: boolean;
  records: OccurrenceRecord[];
}
