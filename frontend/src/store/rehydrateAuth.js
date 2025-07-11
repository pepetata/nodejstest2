import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { rehydrate } from './authSlice';

export default function RehydrateAuth() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(rehydrate());
  }, [dispatch]);
  return null;
}
