type Playlist = {
  title: string;
  getPlaylist: () => string[];
  clearPlaylist: () => void;
  setPlaylist: (newSongs: string[]) => void;
} & ((song: string) => void);

const playlist: Playlist = (() => {
  let songs: string[] = []; // Начальный плейлист
  // Функция для добавления песни
  const playlist = (song: string) => {
    songs.push(song);
  };
  // Название плейлиста
  playlist.title = "Favorites";
  // Метод для получения текущего плейлиста
  playlist.getPlaylist = () => {
    return songs;
  };
  // Метод для очистки плейлиста
  playlist.clearPlaylist = () => {
    songs = [];
  };
  // Метод для замены плейлиста
  playlist.setPlaylist = (newSongs: string[]) => {
    songs = newSongs;
  };
  return playlist;
})();

// Пример работы
console.log(playlist.title); // Favorites
playlist("Song 1");
playlist("Song 2");
console.log(playlist.getPlaylist()); // ["Song 1", "Song 2"]
playlist.setPlaylist(["Song 3", "Song 4"]);
console.log(playlist.getPlaylist()); // ["Song 3", "Song 4"]
playlist.clearPlaylist();
console.log(playlist.getPlaylist()); // []
