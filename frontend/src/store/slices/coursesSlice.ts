import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string | null;
  price: number;
  isFree: boolean;
  level: string;
  instructor: { firstName: string; lastName: string };
  _count?: { enrollments: number; reviews: number };
}

interface CoursesState {
  items: Course[];
  selected: Course | null;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CoursesState = {
  items: [],
  selected: null,
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
};

export const fetchCourses = createAsyncThunk(
  'courses/fetchAll',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/courses', { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch courses');
    }
  },
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setSelected(state, action: PayloadAction<Course | null>) {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.courses;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelected } = coursesSlice.actions;
export default coursesSlice.reducer;
