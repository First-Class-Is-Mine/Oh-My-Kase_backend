exports.uploadImage = (req, res) => {
    if(!read.file) {
        return res.status(400).json({ message: "업로드할 이미지 파일이 없습니다." });
    }
    res.json({ filePath: `/uploads/$${req.file.filename}` });
};