use actix_files::{NamedFile, Files}; // <-- Added Files
use actix_web::{get, web, App, HttpServer, Responder, Result};
use std::path::{Path, PathBuf};
use serde::Serialize;
use std::fs;

#[get("/")]
async fn index() -> Result<NamedFile> {
    Ok(NamedFile::open("static/index.html")?)
}

#[get("/tunes")]
async fn list_tunes() -> Result<impl Responder> {
    let path = Path::new("tunes");
    let mut songs = vec![];

    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            if let Some(ext) = entry.path().extension() {
                if ext == "mp3" {
                    if let Some(name) = entry.file_name().to_str() {
                        songs.push(name.to_string());
                    }
                }
            }
        }
    }

    #[derive(Serialize)]
    struct SongList {
        songs: Vec<String>,
    }

    Ok(web::Json(SongList { songs }))
}

#[get("/tunes/{filename}")]
async fn get_song(path: web::Path<String>) -> Result<NamedFile> {
    let filename = path.into_inner();
    let file_path = PathBuf::from(format!("tunes/{}", filename));
    Ok(NamedFile::open(file_path)?)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(index)
            .service(list_tunes)
            .service(get_song)
            // Serve anything in /static at /static/*
            .service(Files::new("/static", "static").show_files_listing())
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
