import { useEffect, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isMachineAvailable, subscribeToMarketplaceMachines } from '../../services/machineService';
import { createRFQ } from '../../services/rfqService';
import { auth } from '../../firebase/firebase';

const blankForm = {
  title: '',
  machineId: '',
  materialType: '',
  quantity: '',
  quantityUnit: 'pieces',
  jobDescription: '',
  manufacturingLocation: '',
  requiredCompletionDate: '',
  budget: '',
};

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const minimumCompletionDate = localDateString();

function CreateRFQ() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialMachineId = params.get('machineId') || '';
  const [machines, setMachines] = useState([]);
  const [unavailableMachine, setUnavailableMachine] = useState(null);
  const [machineListError, setMachineListError] = useState('');
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [values, setValues] = useState({
    ...blankForm,
    machineId: initialMachineId,
  });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    let unsubscribe;
    try {
      unsubscribe = subscribeToMarketplaceMachines((allMachines) => {
        if (!active) return;
        const selected = allMachines.find((machine) => machine.id === values.machineId);
        setMachines(allMachines.filter((machine) =>
          machine.ownerUid !== auth.currentUser?.uid && isMachineAvailable(machine)
        ));
        setUnavailableMachine(
          selected && !isMachineAvailable(selected) ? selected : null
        );
        if (initialMachineId && !selected) {
          setMachineListError('The selected machine no longer exists.');
        } else if (selected?.ownerUid === auth.currentUser?.uid) {
          setMachineListError('You cannot submit an enquiry for your own machine.');
        } else if (selected && !isMachineAvailable(selected)) {
          setMachineListError('This machine is currently unavailable for new enquiries.');
        } else {
          setMachineListError('');
        }
        if (selected && isMachineAvailable(selected) && selected.ownerUid !== auth.currentUser?.uid) {
          setValues((current) => ({
            ...current,
            machineId: current.machineId || selected.id,
            manufacturingLocation: current.manufacturingLocation || selected.location || '',
          }));
        }
        setMachinesLoading(false);
      }, (error) => {
        console.error('RFQ machine list subscription error:', error);
        if (!active) return;
        setMachineListError(error.message || 'Unable to load machines.');
        setMachinesLoading(false);
      });
    } catch (error) {
      console.error('RFQ machine list subscription error:', error);
      setMachineListError(error.message || 'Unable to load machines.');
      setMachinesLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [initialMachineId, values.machineId]);

  const update = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    if (name === 'machineId') {
      setMachineListError('');
      setUnavailableMachine(null);
    }
  };

  const persist = async (event) => {
    event.preventDefault();
    if (saving) return;

    const nextErrors = {};
    if (!values.title.trim()) nextErrors.title = 'Enter a requirement title.';
    if (!values.machineId) nextErrors.machineId = 'Choose a machine.';
    ['jobDescription', 'materialType', 'quantity', 'manufacturingLocation', 'requiredCompletionDate'].forEach((field) => {
      if (!String(values[field] || '').trim()) nextErrors[field] = 'This field is required.';
    });
    if (values.quantity && (!Number.isFinite(Number(values.quantity)) || Number(values.quantity) <= 0)) {
      nextErrors.quantity = 'Quantity must be greater than zero.';
    }
    if (values.requiredCompletionDate) {
      const today = localDateString();
      if (values.requiredCompletionDate < today) nextErrors.requiredCompletionDate = 'Choose today or a future date.';
    }
    if (values.budget && (!Number.isFinite(Number(values.budget)) || Number(values.budget) < 0)) {
      nextErrors.budget = 'Enter a valid budget.';
    }

    setErrors(nextErrors);
    setSaveError('');
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      await createRFQ(values);
      navigate('/seeker/rfqs', {
        replace: true,
        state: { notice: 'RFQ submitted successfully.' },
      });
    } catch (error) {
      console.error('RFQ save failed:', error);
      setSaveError(error.message || 'Unable to submit the RFQ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="seeker-page">
      <Link to="/seeker/rfqs" className="seeker-back-link"><ArrowLeft size={16} /> Back to RFQs</Link>
      <div className="dashboard-heading seeker-form-page-heading">
        <div><span className="eyebrow-label">MANUFACTURING REQUIREMENT</span><h1>Create a new RFQ</h1><p>Share enough detail for providers to prepare an accurate quotation.</p></div>
      </div>
      <form className="provider-panel seeker-rfq-form" noValidate onSubmit={persist}>
        <div className="seeker-form-section-heading"><span>01</span><div><h2>Requirement overview</h2><p>Describe the manufacturing process and quantity needed.</p></div></div>
        <div className="seeker-form-grid">
          <Field label="Requirement Title" name="title" value={values.title} onChange={update} error={errors.title} placeholder="e.g. Aluminium sensor housings" />
          <label className="field-group seeker-field" htmlFor="rfq-machineId">
            <span>Machine</span>
            <select id="rfq-machineId" name="machineId" value={values.machineId} onChange={update} aria-invalid={Boolean(errors.machineId)} disabled={machinesLoading}>
              <option value="">Choose a machine</option>
              {unavailableMachine && values.machineId === unavailableMachine.id && (
                <option value={unavailableMachine.id} disabled>
                  {unavailableMachine.name} · currently unavailable
                </option>
              )}
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} · {machine.manufacturer || ''} {machine.model || ''}
                </option>
              ))}
            </select>
            {errors.machineId && <small className="field-error">{errors.machineId}</small>}
          </label>
          {machineListError && (
            <p className="field-error seeker-field-wide" role="alert">{machineListError}</p>
          )}
          <Field label="Material Type" name="materialType" value={values.materialType} onChange={update} error={errors.materialType} placeholder="e.g. 6061 aluminium" />
          <Field label="Required Quantity" name="quantity" type="number" min="1" value={values.quantity} onChange={update} error={errors.quantity} placeholder="Number of units" />
          <Field label="Quantity Unit" name="quantityUnit" value={values.quantityUnit} onChange={update} error={errors.quantityUnit} as="select" options={['pieces', 'parts', 'kg', 'hours', 'batches', 'sets']} placeholder="Choose unit" />
          <Field label="Required Completion Date" name="requiredCompletionDate" type="date" min={minimumCompletionDate} value={values.requiredCompletionDate} onChange={update} error={errors.requiredCompletionDate} />
          <Field label="Manufacturing Location" name="manufacturingLocation" value={values.manufacturingLocation} onChange={update} error={errors.manufacturingLocation} placeholder="City, state, or region" />
          <Field label="Budget (optional)" name="budget" type="number" min="0" value={values.budget} onChange={update} error={errors.budget} placeholder="e.g. 100000" />
          <Field label="Job Description" name="jobDescription" value={values.jobDescription} onChange={update} error={errors.jobDescription} as="textarea" placeholder="Describe the work, tolerances, finish, quantity, and other requirements" wide />
        </div>

        {saveError && <div className="field-error" role="alert">{saveError}</div>}
        <div className="seeker-form-footer">
          <Link className="btn btn-ghost" to="/seeker/rfqs">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving || machinesLoading || Boolean(machineListError)}>
            {saving ? 'Submitting...' : 'Submit RFQ'} <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder, as, options = [], min, wide }) {
  const id = `rfq-${name}`;
  return (
    <label className={`field-group seeker-field ${wide ? 'seeker-field-wide' : ''}`} htmlFor={id}>
      <span>{label}</span>
      {as === 'textarea' ? <textarea id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} rows="4" aria-invalid={Boolean(error)} /> :
        as === 'select' ? <select id={id} name={name} value={value} onChange={onChange} aria-invalid={Boolean(error)}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select> :
          <input id={id} name={name} type={type} min={min} value={value} onChange={onChange} placeholder={placeholder} aria-invalid={Boolean(error)} />}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export default CreateRFQ;
