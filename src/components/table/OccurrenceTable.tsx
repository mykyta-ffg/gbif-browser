import { GbifOccurrenceResponse } from "../../model/GbifOccurrenceResponse";
import { Spinner, Table } from "react-bootstrap";

export default function OccurrenceTable({ isLoading, values }: TableProps) {
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Scientific name</th>
            <th>Generic name</th>
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
            values.map((value, idx) => (
              <tr key={`occurrence-${idx}`}>
                <td>{value.scientificName}</td>
                <td>{value.genericName}</td>
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
      <div className="text-center">{isLoading ? <Spinner /> : !values.length && "No data"}</div>
    </>
  );
}

export interface TableProps {
  isLoading: boolean;
  values: GbifOccurrenceResponse[];
}
