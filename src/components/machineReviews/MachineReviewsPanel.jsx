import { useState } from 'react';
import MachineReviewForm from './MachineReviewForm';
import MachineReviewList from './MachineReviewList';

export default function MachineReviewsPanel({
  machineId,
  machineName,
  providerUid,
  providerCompanyId,
})  {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReviewSubmitted = async () => {
    setRefreshKey((current) => current + 1);
  };

  if (!machineId) return null;

  return (
    <section style={styles.panel}>
      <MachineReviewList
        machineId={machineId}
        refreshKey={refreshKey}
      />

      <MachineReviewForm
        machineId={machineId}
        machineName={machineName}
        providerUid={providerUid}
        providerCompanyId={providerCompanyId}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </section>
  );
}

const styles = {
  panel: {
    width: '100%',
    marginTop: '20px',
  },
};