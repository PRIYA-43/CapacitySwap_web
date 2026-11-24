
import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Check, Save, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import {
  createMachine,
  getMachineById,
  updateMachine,
} from '../../services/machineService';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyMachine = {
  name: '',
  category: '',
  manufacturer: '',
  model: '',
  description: '',
  materials: '',
  location: '',
  hours: '',
  rate: '',
  availability: 'Available',
  schedule: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  image: '',
  images: [],
};

function AddMachine() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const machineId = searchParams.get('id');

  const [values, setValues] = useState(emptyMachine);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(Boolean(machineId));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Load machine from Firestore when editing.
  useEffect(() => {
    let cancelled = false;

    async function loadMachine() {
      if (!machineId) {
        setValues(emptyMachine);
        setLoading(false);
        return;
      }

      try {
        const machine = await getMachineById(machineId);

        if (!machine || machine.ownerUid !== auth.currentUser?.uid) {
          if (!cancelled) {
            setSaveError('Machine not found or you do not have permission to edit it.');
          }
          return;
        }

        if (!cancelled) {
          setValues({
            ...emptyMachine,
            ...machine,
            materials: Array.isArray(machine.materials)
              ? machine.materials.join(', ')
              : machine.materials || '',
            schedule: machine.schedule || emptyMachine.schedule,
            images: machine.images || (machine.image ? [machine.image] : []),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSaveError(error.message || 'Unable to load machine.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMachine();

    return () => {
      cancelled = true;
    };
  }, [machineId]);

  const updateValue = (event) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));

    setSaved(false);
    setSaveError('');
  };

  const toggleDay = (day) => {
    setValues((current) => ({
      ...current,
      schedule: current.schedule.includes(day)
        ? current.schedule.filter((item) => item !== day)
        : [...current.schedule, day],
    }));

    setErrors((current) => ({
      ...current,
      schedule: '',
    }));
  };

  const handleImage = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    if (files.length + values.images.length > 3) {
      setImageError('Choose up to 3 images.');
      event.target.value = '';
      return;
    }

    if (files.some((file) => !file.type.startsWith('image/'))) {
      setImageError('Choose image files only.');
      event.target.value = '';
      return;
    }

    // Firestore documents have a size limit.
    // Keep each image small while using Spark plan.
    if (files.some((file) => file.size > 150 * 1024)) {
      setImageError('Each image must be 150 KB or smaller.');
      event.target.value = '';
      return;
    }

    Promise.all(files.map(readImageFile))
      .then((images) => {
        setValues((current) => {
          const nextImages = [...current.images, ...images];

          return {
            ...current,
            images: nextImages,
            image: nextImages[0] || '',
          };
        });

        setImageError('');
        setSaved(false);
      })
      .catch(() => {
        setImageError('The selected image could not be read.');
      });

    event.target.value = '';
  };

  const removeImage = (image) => {
    const images = values.images.filter((item) => item !== image);

    setValues((current) => ({
      ...current,
      images,
      image: images[0] || '',
    }));

    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const nextErrors = {};

    [
      'name',
      'category',
      'manufacturer',
      'model',
      'description',
      'materials',
      'location',
      'hours',
      'rate',
    ].forEach((key) => {
      if (!String(values[key] ?? '').trim()) {
        nextErrors[key] = 'This field is required.';
      }
    });

    if (
      values.hours &&
      (!Number.isFinite(Number(values.hours)) || Number(values.hours) <= 0)
    ) {
      nextErrors.hours = 'Enter available hours greater than zero.';
    }

    if (
      values.rate &&
      (!Number.isFinite(Number(values.rate)) || Number(values.rate) <= 0)
    ) {
      nextErrors.rate = 'Enter an hourly rate greater than zero.';
    }

    if (!values.schedule.length) {
      nextErrors.schedule = 'Choose at least one available day.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const machineData = {
      ...values,
      name: values.name.trim(),
      manufacturer: values.manufacturer.trim(),
      model: values.model.trim(),
      description: values.description.trim(),
      location: values.location.trim(),
      hours: Number(values.hours),
      rate: Number(values.rate),
      materials: values.materials
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      image:
        values.image ||
        'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
      images: values.images,
    };

    try {
      setSaving(true);
      setSaveError('');
      setSaved(false);

      if (machineId) {
        await updateMachine(machineId, machineData);
      } else {
        await createMachine(machineData);
      }

      setSaved(true);

      // Navigate only after Firestore confirms success.
      window.setTimeout(() => {
        navigate('/provider/machines');
      }, 800);
    } catch (error) {
      console.error('Machine save failed:', error);
      setSaveError(error.message || 'Unable to save machine.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="provider-panel seeker-empty-state">
        <p>Loading machine details...</p>
      </div>
    );
  }

  return (
    <div className="machine-form-page">
      <div className="dashboard-heading">
        <div>
          <Link to="/provider/machines" className="back-link">
            <ArrowLeft size={15} /> My Machines
          </Link>

          <span className="eyebrow-label">MACHINE LISTING</span>

          <h1>{machineId ? 'Edit machine details' : 'Add a new machine'}</h1>

          <p>
            Share machine capabilities and available production hours
            with your network.
          </p>
        </div>
      </div>


      <form
        className="provider-panel machine-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <section className="machine-form-section">
          <div className="form-section-title">
            <span className="section-step">01</span>
            <div>
              <h2>Machine details</h2>
              <p>Identify the equipment and its production capabilities.</p>
            </div>
          </div>

          <div className="form-grid-two">
            <FormField
              label="Machine Name"
              name="name"
              value={values.name}
              onChange={updateValue}
              error={errors.name}
              placeholder="e.g. VF-2 Vertical Machining Center"
            />

            <div className="field-group">
              <label htmlFor="machine-category">Machine Category</label>

              <select
                id="machine-category"
                name="category"
                value={values.category}
                onChange={updateValue}
                aria-invalid={Boolean(errors.category)}
              >
                <option value="">Select category</option>
                <option>CNC Milling</option>
                <option>CNC Turning</option>
                <option>Laser Cutting</option>
                <option>Sheet Metal</option>
                <option>Grinding</option>
                <option>Injection Moulding</option>
                <option>Other</option>
              </select>

              {errors.category && (
                <span className="field-error">{errors.category}</span>
              )}
            </div>

            <FormField
              label="Manufacturer"
              name="manufacturer"
              value={values.manufacturer}
              onChange={updateValue}
              error={errors.manufacturer}
              placeholder="e.g. Haas"
            />

            <FormField
              label="Model Number"
              name="model"
              value={values.model}
              onChange={updateValue}
              error={errors.model}
              placeholder="e.g. VF-2"
            />

            <FormField
              label="Machine Location"
              name="location"
              value={values.location}
              onChange={updateValue}
              error={errors.location}
              placeholder="City, state / region"
            />

            <FormField
              label="Supported Materials"
              name="materials"
              value={values.materials}
              onChange={updateValue}
              error={errors.materials}
              placeholder="Aluminium, mild steel, brass"
              hint="Separate materials with commas."
            />

            <div className="field-group full-width">
              <label htmlFor="machine-description">
                Machine Description
              </label>

              <textarea
                id="machine-description"
                name="description"
                rows="4"
                value={values.description}
                onChange={updateValue}
                aria-invalid={Boolean(errors.description)}
                placeholder="Describe the machine's capabilities, tolerances, or setup."
              />

              {errors.description && (
                <span className="field-error">{errors.description}</span>
              )}
            </div>
          </div>
        </section>

        <section className="machine-form-section">
          <div className="form-section-title">
            <span className="section-step">02</span>
            <div>
              <h2>Availability &amp; rate</h2>
              <p>Set the available working time and indicative hourly rate.</p>
            </div>
          </div>

          <div className="form-grid-two">
            <FormField
              label="Available Working Hours"
              name="hours"
              type="number"
              min="1"
              value={values.hours}
              onChange={updateValue}
              error={errors.hours}
              placeholder="e.g. 24"
            />

            <FormField
              label="Hourly Rate (INR)"
              name="rate"
              type="number"
              min="1"
              value={values.rate}
              onChange={updateValue}
              error={errors.rate}
              placeholder="e.g. 1800"
            />
          </div>

          <div className="field-group schedule-field">
            <span className="form-label">Availability Schedule</span>

            <div
              className="weekday-picker"
              role="group"
              aria-label="Availability schedule"
            >
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`weekday-chip ${
                    values.schedule.includes(day) ? 'selected' : ''
                  }`}
                  onClick={() => toggleDay(day)}
                  aria-pressed={values.schedule.includes(day)}
                >
                  {values.schedule.includes(day) && <Check size={13} />}
                  {day}
                </button>
              ))}
            </div>

            {errors.schedule && (
              <span className="field-error">{errors.schedule}</span>
            )}
          </div>
        </section>

        <section className="machine-form-section">
          <div className="form-section-title">
            <span className="section-step">03</span>
            <div>
              <h2>Machine images</h2>
              <p>Add up to three images to help companies understand the equipment.</p>
            </div>
          </div>

          {values.images.length > 0 && (
            <div className="image-preview-list">
              {values.images.map((image, index) => (
                <div
                  className="image-preview-item"
                  key={`${image.slice(0, 40)}-${index}`}
                >
                  <img
                    src={image}
                    alt={`Machine preview ${index + 1}`}
                  />

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => removeImage(image)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="image-upload" htmlFor="machine-image">
            <span className="upload-placeholder">
              <Camera size={24} />
              <strong>
                {values.images.length ? 'Add more images' : 'Upload machine images'}
              </strong>
              <small>JPG, PNG or WebP · up to 3 images, 150 KB each</small>
            </span>

            <input
              id="machine-image"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImage}
            />
          </label>

          {imageError && <span className="field-error">{imageError}</span>}
        </section>

        {saveError && (
          <div className="field-error" role="alert">
            {saveError}
          </div>
        )}

        {saved && (
          <div className="inline-success" role="status">
            Machine saved successfully. Redirecting...
          </div>
        )}

        <div className="form-footer-actions">
          <Link to="/provider/machines" className="btn btn-ghost">
            <X size={15} /> Cancel
          </Link>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            <Save size={16} />
            {saving
              ? 'Saving...'
              : machineId
                ? 'Save Changes'
                : 'Save Machine'}
          </button>
        </div>
      </form>
    </div>
  );
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read image file.'));

    reader.readAsDataURL(file);
  });
}

function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  min,
  hint,
}) {
  return (
    <div className="field-group">
      <label htmlFor={`machine-${name}`}>{label}</label>

      <input
        id={`machine-${name}`}
        name={name}
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />

      {hint && <small className="field-hint">{hint}</small>}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default AddMachine;
