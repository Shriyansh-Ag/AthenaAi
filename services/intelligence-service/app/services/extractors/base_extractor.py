from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
from app.models.document import ExtractedDocument

class BaseExtractor(ABC):
    """
    Base class for all document extractors.
    """
    
    @abstractmethod
    def extract(self, file_stream: BinaryIO, filename: str) -> ExtractedDocument:
        """
        Extracts content from a file stream and returns an ExtractedDocument.
        
        :param file_stream: A binary stream of the file to extract.
        :param filename: The original filename.
        :return: An ExtractedDocument containing structured data.
        """
        pass
