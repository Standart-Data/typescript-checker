interface Film {
  id: string;
  name: string;
  year: number;
  duration: number;
  cast: string[];
  link: string;
  rating: number;
  genres: string[];
  description: string;
  logo: string;
}

// Ваш код
type FilmPreview = Pick<
  Film,
  "id" | "description" | "genres" | "logo" | "name"
>;
