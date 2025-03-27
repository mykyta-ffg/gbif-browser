import { wait } from "../../util";
import { GbifOccurrenceResponseResult } from "../../model/GbifOccurrenceResponseResult";
import { OccurrenceRecordAvailability } from "../../model/OccurrenceRecordAvailability";
import { OccurrenceRecord } from "../../model/OccurrenceRecord";
import { useEffect, useState } from "react";

async function getBrunsAvailability(query: string, retries: number[]): Promise<boolean> {
  const corsProxyDomain = "https://corsproxy.io/?";
  const brunsDomain = corsProxyDomain + "https://online.bruns.de";

  try {
    const response = await fetch(`${brunsDomain}/de-de/suche?q=${query}`, { redirect: "manual" });
    if (response.type === "opaqueredirect") {
      console.debug(`Found ${query} in Bruns catalogue`);

      return true;
    }
  } catch (e) {
    const delay = retries.shift();
    if (delay === undefined) {
      console.debug(`Failed to check availability of ${query} in Bruns catalogue: will assume it's absent`);
    } else {
      console.debug(`Will wait for ${delay}ms and retry`);
      await wait(delay);

      return await getBrunsAvailability(query, retries);
    }
  }

  return false;
}

async function getAvailability(record: GbifOccurrenceResponseResult) {
  const key = `${record.taxonKey}-availability`;
  const scientificName = record.scientificName;
  const cachedAvailability = JSON.parse(sessionStorage.getItem(key) ?? "{}") as OccurrenceRecordAvailability;
  if (Object.keys(cachedAvailability).length) {
    console.debug(`Cache hit for ${scientificName} (${key})`);
  } else {
    console.debug(`Cache miss for ${scientificName} (${key})`);

    const availability: OccurrenceRecordAvailability = {
      bruns: await getBrunsAvailability(scientificName, [60_000, 5_000, 10_000, 15_000, 30_000]),
    };

    sessionStorage.setItem(key, JSON.stringify(availability));

    return availability;
  }

  return cachedAvailability;
}

export default function OccurrenceAvailability({ record }: OccurrenceAvailabilityProps) {
  const [availability, setAvailability] = useState<OccurrenceRecordAvailability | null>(null);
  useEffect(() => {
    const checkAvailability = async () => {
      setAvailability(await getAvailability(record));
    };

    console.debug(`Will check availability of ${record.scientificName}`);
    checkAvailability().catch((e: any) =>
      console.error(`Error checking availability of ${record.scientificName}: `, e),
    );
  }, [record]);

  return (
    <>
      {availability === null ? (
        "Loading..."
      ) : availability.bruns ? (
        <span>
          <img
            alt="Bruns"
            src="https://www.bruns.de/wp-content/uploads/2021/02/favicon.ico"
            style={{ paddingRight: "4px" }}
          />
          <a href={`https://online.bruns.de/de-de/suche?q=${record.scientificName}`} target="_blank">
            Bruns
          </a>
        </span>
      ) : (
        "—"
      )}
    </>
  );
}

export interface OccurrenceAvailabilityProps {
  record: OccurrenceRecord;
}
