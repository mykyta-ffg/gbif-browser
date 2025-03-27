import { OccurrenceRecordInfo } from "../../model/OccurrenceRecordInfo";
import { Image } from "react-bootstrap";

export default function OccurrenceInfo({ info, showFullInfo }: OccurrenceInfoProps) {
  return (
    <div style={{ maxWidth: "350px" }}>
      <div className="text-center">
        {showFullInfo && info.image && (
          <Image
            loading="lazy"
            style={{ padding: "10px" }}
            alt={`Picture of ${info.englishName}`}
            src={info.image}
            thumbnail
          />
        )}
      </div>
      <details>
        <summary className="text-center">
          <u>{info.englishName}</u>
        </summary>

        <p>{info.summary}</p>
      </details>
    </div>
  );
}

export interface OccurrenceInfoProps {
  info: OccurrenceRecordInfo;
  showFullInfo: boolean;
}
