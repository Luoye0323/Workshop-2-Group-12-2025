import { useState }  from 'react'
import { uploadFiles } from '../services/api'

function FileUpload({ onUploadSuccess }) {
    const [ selectedFiles, setSelectedFiles ] = useState([]);
    const [ uploading, setUploading ] = useState(false);
    const [ progress, setProgress ] = useState(0);
    const [ results, setResults ] = useState([]);

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
        setResults([]);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select files first');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const data = await uploadFiles(selectedFiles, (percent) => {
                setProgress(percent);
            });

            setResults(data.results);
            setSelectedFiles([]);

            if (onUploadSuccess) {
                onUploadSuccess(data.results);
            }
        } catch (error) {
            console.error('Upload failed: ', error);
            alert('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className='file-upload'>
            <h3>Upload files</h3>

            <input type="file" 
            multiple
            accept='.pdf, .png, .jpg, .jpeg, .pdf'
            onChange={handleFileChange}
            disabled={uploading}
            />

            {selectedFiles.length > 0 && (
            <div className="selected-files">
            <p>Selected {selectedFiles.length} file(s)</p>
            <ul>
                {selectedFiles.map((file, idx) => (
                <li key={idx}>{file.name}</li>
                ))}
            </ul>
            </div>
        )}

        <button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
            {uploading ? `Uploading... ${progress}%` : 'Upload & Process'}
        </button>

        {results.length > 0 && (
            <div className='results'>
                <h4>Results:</h4>
                {results.map((result, idx) => (
                    <div key={idx} className={`result-item ${result.status}`}>
                      <strong>{result.filename}</strong>  
                      {result.status === 'success' && (
                                               <div>
                            <p>Tables found: {result.table_found}</p>
                            <button onClick={() => window.open(`http://localhost:5001/api/download/excel/${result.excel_file}`)}>
                                Download Excel
                            </button>
                            <button onClick={() => window.open(`http://localhost:5001/api/download/pptx/${result.pptx_file}`)}>
                                Download Powerpoint
                            </button>
                        </div> 
                      )}
                      {result.status === 'no_tables' && <p>No tables found</p>}
                      {result.status === 'error' && <p>Error: {result.error}</p>}
                    </div>
                ))}
            </div>
        )}
        </div>
    );
}

export default FileUpload;