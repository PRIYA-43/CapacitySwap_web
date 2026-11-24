import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import MachineCard from '../../components/seeker/MachineCard';
import { isMachineAvailable, subscribeToMarketplaceMachines } from '../../services/machineService';
import { getMachineRatingSummaries } from '../../services/machineReviewService';

const PAGE_SIZE = 6;

function BrowseMachines() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();
  const [searchState, setSearchState] = useState(() => ({
    locationSearch: routerLocation.search,
    value: searchParams.get('search') || '',
  }));
  const search = searchState.locationSearch === routerLocation.search
    ? searchState.value
    : searchParams.get('search') || '';
  const [location, setLocation] = useState('All locations');
  const [category, setCategory] = useState('All categories');
  const [availability, setAvailability] = useState('All availability');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [sort, setSort] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingSummaries, setRatingSummaries] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToMarketplaceMachines(
      (items) => {
        setMachines(items);
        setError('');
        setLoading(false);
      },
      (subscriptionError) => {
        console.error('Marketplace subscription error:', subscriptionError);
        setError(subscriptionError.message || 'Unable to load machine listings.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;
    getMachineRatingSummaries()
      .then((summaries) => {
        if (active) setRatingSummaries(summaries);
      })
      .catch((loadError) => {
        console.error('Machine rating summary error:', loadError);
      });
    return () => { active = false; };
  }, []);

  const availableMachines = useMemo(
    () => machines.filter(isMachineAvailable),
    [machines]
  );
  const locations = [...new Set(availableMachines.map((machine) => machine.location).filter(Boolean))];
  const categories = [...new Set(availableMachines.map((machine) => machine.category).filter(Boolean))];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = availableMachines.filter((machine) => {
      const matchesSearch = !term || [
        machine.name,
        machine.category,
        machine.manufacturer,
        machine.model,
        machine.location,
        machine.providerName,
        machine.providerCompanyName,
      ].some((value) => String(value || '').toLowerCase().includes(term));
      const matchesLocation = location === 'All locations' || machine.location === location;
      const matchesCategory = category === 'All categories' || machine.category === category;
      const matchesAvailability = availability === 'All availability' || machine.availability === availability;
      const matchesMin = !minRate || Number(machine.rate || 0) >= Number(minRate);
      const matchesMax = !maxRate || Number(machine.rate || 0) <= Number(maxRate);
      return matchesSearch && matchesLocation && matchesCategory && matchesAvailability && matchesMin && matchesMax;
    });

    return result.sort((first, second) => sort === 'price-low'
      ? first.rate - second.rate
      : sort === 'price-high'
        ? second.rate - first.rate
        : (second.createdAt?.toMillis?.() || 0) - (first.createdAt?.toMillis?.() || 0));
  }, [availableMachines, search, location, category, availability, minRate, maxRate, sort]);

  const clearFilters = () => {
    setSearchState({ locationSearch: routerLocation.search, value: '' });
    setLocation('All locations');
    setCategory('All categories');
    setAvailability('All availability');
    setMinRate('');
    setMaxRate('');
    setSort('newest');
    setSearchParams({});
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="seeker-page">
      <div className="dashboard-heading">
        <div><span className="eyebrow-label">CAPACITY MARKETPLACE</span><h1>Browse machines</h1><p>Compare providers and find manufacturing capacity for your next job.</p></div>
      </div>
      <section className="provider-panel seeker-filter-panel">
        <div className="seeker-filter-title"><Filter size={17} /><strong>Find the right capacity</strong><button type="button" className="seeker-text-button" onClick={clearFilters}><RotateCcw size={14} />Clear filters</button></div>
        <div className="seeker-filter-grid">
          <label className="seeker-search-field"><span>Search by name, category, or provider</span><div><Search size={16} /><input value={search} onChange={(event) => { setSearchState({ locationSearch: routerLocation.search, value: event.target.value }); setVisibleCount(PAGE_SIZE); }} placeholder="e.g. CNC milling" /></div></label>
          <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>All locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option>All availability</option><option>Available</option><option>Limited</option></select></label>
          <label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest listings</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
          <div className="seeker-rate-filter"><span>Hourly rate range (₹)</span><div><input type="number" min="0" aria-label="Minimum hourly rate" value={minRate} onChange={(event) => setMinRate(event.target.value)} placeholder="Min" /><span>to</span><input type="number" min="0" aria-label="Maximum hourly rate" value={maxRate} onChange={(event) => setMaxRate(event.target.value)} placeholder="Max" /></div></div>
        </div>
      </section>
      <div className="seeker-results-heading"><strong>{filtered.length} machines</strong><span>{loading ? 'Loading live listings' : 'Showing live listings'}</span></div>
      {error ? (
        <div className="provider-panel seeker-empty-state" role="alert">
          <h2>Unable to load machines</h2>
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="provider-panel seeker-empty-state">
          <h2>Loading machines...</h2>
          <p>Retrieving listings from Firestore.</p>
        </div>
      ) : filtered.length ? <>
        <div className="machine-grid seeker-market-grid">{filtered.slice(0, visibleCount).map((machine) => {
          const rating = ratingSummaries[machine.id];
          return <MachineCard key={machine.id} machine={{
            ...machine,
            providerRating: rating?.totalReviews ? `${rating.averageRating} (${rating.totalReviews})` : 'Not rated',
          }} />;
        })}</div>
        {visibleCount < filtered.length && <div className="seeker-load-more"><button type="button" className="btn btn-ghost" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Load more machines</button></div>}
      </> : <div className="provider-panel seeker-empty-state"><Search size={24} /><h2>{availableMachines.length ? 'No machines found' : 'No machines available.'}</h2><p>{availableMachines.length ? 'Try changing your search terms or filters.' : machines.length ? 'All listed machines are currently unavailable.' : 'Available machine listings will appear here.'}</p>{availableMachines.length > 0 && <button type="button" className="btn btn-primary" onClick={clearFilters}>Reset search</button>}</div>}
    </div>
  );
}

export default BrowseMachines;
