import re
from typing import Dict, Any, List, Optional
import pdfplumber
from loguru import logger
from io import BytesIO
import camelot
import os

class PDFExtractor:
    def __init__(self):
        # Pre-compile regular expressions for better performance
        self.patterns = {
            'total_area': re.compile(r'Total\s*Area\s*[=:]\s*([\d,]+)', re.IGNORECASE),
            'predominant_pitch': re.compile(r'Predominant\s*Pitch\s*[=:]\s*(\d+/\d+)', re.IGNORECASE),
            'ridges': re.compile(r'Ridge[s]?\s*[=:]\s*([\d,.]+)\s*(?:ft|feet|\')?', re.IGNORECASE),
            'valleys': re.compile(r'Valley[s]?\s*[=:]\s*([\d,.]+)\s*(?:ft|feet|\')?', re.IGNORECASE),
            'eaves': re.compile(r'Eave[s]?\s*[=:]\s*([\d,.]+)\s*(?:ft|feet|\')?', re.IGNORECASE),
            'rakes': re.compile(r'Rake[s]?\s*[=:]\s*([\d,.]+)\s*(?:ft|feet|\')?', re.IGNORECASE),
            'hips': re.compile(r'Hip[s]?\s*[=:]\s*([\d,.]+)\s*(?:ft|feet|\')?', re.IGNORECASE),
            'flashing': re.compile(r'Flashing\s*[=:]\s*([\d,.]+)\s*(?:ft|feet|\')?', re.IGNORECASE),
            'step_flashing': re.compile(r'Step\s*Flashing\s*[=:]\s*([\d,.]+)\s*(?:ft|feet|\')?', re.IGNORECASE),
            'penetrations_area': re.compile(r'Penetrations?\s*Area\s*[=:]\s*(\d+)', re.IGNORECASE),
            'penetrations_perimeter': re.compile(r'Penetrations?\s*Perimeter\s*[=:]\s*(\d+)', re.IGNORECASE),
            'areas_per_pitch_table': re.compile(r'Areas\s+per\s+Pitch.*?(?=Structure|\Z)', re.IGNORECASE | re.DOTALL),
            'pitch_row': re.compile(r'(?:Roof\s+Pitches|Pitch)\s*(\d+/\d+).*?Area.*?(?:sq\s*ft)?\s*([\d,.]+).*?(?:Roof)?\s*(\d+)%', re.IGNORECASE | re.DOTALL)
        }

    def find_measurement_with_count(self, text: str, key: str, length: float) -> Optional[int]:
        """Find count for a measurement using various patterns."""
        try:
            # Debug the text we're searching in
            logger.debug(f"Searching for {key} count in text: {text[:200]}...")

            # Pattern 1: Look for small numbers (1-2 digits) in parentheses after measurement
            after_pattern = rf'{key}.*?{length}\s*(?:ft|feet|\')?\s*\(([1-9][0-9]?)\)'
            after_match = re.search(after_pattern, text, re.IGNORECASE | re.DOTALL)
            if after_match:
                logger.debug(f"Found count after {key}: {after_match.group(1)}")
                return int(after_match.group(1))

            # Pattern 2: Look for small numbers before measurement
            before_pattern = rf'([1-9][0-9]?)\s*{key}'
            before_match = re.search(before_pattern, text, re.IGNORECASE)
            if before_match:
                logger.debug(f"Found count before {key}: {before_match.group(1)}")
                return int(before_match.group(1))

            # Pattern 3: Look for count in a broader context, still limiting to small numbers
            context_pattern = rf'{key}.*?{length}.*?\(([1-9][0-9]?)\)'
            context_match = re.search(context_pattern, text, re.IGNORECASE | re.DOTALL)
            if context_match:
                logger.debug(f"Found count in context for {key}: {context_match.group(1)}")
                return int(context_match.group(1))

            # If no count found, return 1 as default
            logger.warning(f"No count found for {key} with length {length}, using default count of 1")
            return 1

        except Exception as e:
            logger.error(f"Error finding count for {key}: {e}")
            return 1

    def extract_areas_per_pitch_camelot(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract areas per pitch using Camelot library."""
        try:
            logger.debug(f"Attempting to read PDF with Camelot from: {pdf_path}")
            
            # Try lattice mode first (for tables with borders)
            logger.debug("Trying lattice mode...")
            tables = camelot.read_pdf(
                pdf_path,
                pages='9',
                flavor='lattice',
                strip_text='\n'
            )
            
            if len(tables) == 0:
                logger.debug("No tables found with lattice mode, trying stream mode...")
                # If no tables found, try stream mode
                tables = camelot.read_pdf(
                    pdf_path,
                    pages='9',
                    flavor='stream'
                )
            
            logger.debug(f"Found {len(tables)} tables")
            
            if len(tables) == 0:
                logger.warning("No tables found by Camelot in either mode")
                return []

            # Debug all tables found
            for idx, table in enumerate(tables):
                logger.debug(f"\nTable {idx + 1} contents:")
                logger.debug(f"Number of rows: {len(table.df)}")
                logger.debug(f"Number of columns: {len(table.df.columns)}")
                logger.debug("First few rows:")
                for row in table.df.values.tolist()[:3]:
                    logger.debug(f"Row: {row}")

            # Find the table with "Areas per Pitch"
            pitch_table = None
            for idx, table in enumerate(tables):
                table_data = table.df.values.tolist()
                table_text = ' '.join([' '.join(map(str, row)) for row in table_data])
                logger.debug(f"Table {idx + 1} text: {table_text[:200]}...")
                
                if 'Areas per Pitch' in table_text or any('/' in str(cell) for row in table_data for cell in row):
                    pitch_table = table
                    logger.debug(f"Found pitch table in table {idx + 1}")
                    break

            if not pitch_table:
                logger.warning("Areas per Pitch table not found in any table")
                return []

            areas_per_pitch = []
            table_data = pitch_table.df.values.tolist()
            
            # Process each row
            for row in table_data:
                row_text = ' '.join(map(str, row))
                logger.debug(f"Processing row: {row_text}")
                
                # Check if row has pitch data (contains /)
                if any('/' in str(cell) for cell in row):
                    try:
                        # Find the cells containing pitch, area, and percentage
                        pitch_cell = next(cell for cell in row if '/' in str(cell))
                        numeric_cells = [str(cell).replace(',', '') for cell in row 
                                       if str(cell).replace(',', '').replace('.', '').isdigit()]
                        
                        if len(numeric_cells) >= 2:
                            pitch = pitch_cell.strip()
                            area = float(numeric_cells[0])
                            percentage = int(float(numeric_cells[1]))
                            
                            areas_per_pitch.append({
                                'pitch': pitch,
                                'area': area,
                                'percentage': percentage
                            })
                            logger.debug(f"Successfully extracted: {pitch} - {area} sq ft ({percentage}%)")
                    except Exception as e:
                        logger.error(f"Error processing row {row}: {e}")
                        continue

            logger.debug(f"Final extracted areas per pitch: {areas_per_pitch}")
            return areas_per_pitch

        except Exception as e:
            logger.error(f"Error in Camelot extraction: {e}")
            return []

    def extract_areas_per_pitch_fallback(self, text: str) -> List[Dict[str, Any]]:
        """Fallback method using regex patterns when Camelot fails."""
        try:
            # Find the areas per pitch table
            table_match = self.patterns['areas_per_pitch_table'].search(text)
            if not table_match:
                logger.warning("Areas per pitch table not found in fallback")
                return []

            table_text = table_match.group(0)
            logger.debug(f"Found areas per pitch table text: {table_text}")

            # Extract each pitch row
            areas_per_pitch = []
            for match in self.patterns['pitch_row'].finditer(table_text):
                try:
                    pitch = match.group(1)
                    area = float(match.group(2).replace(',', ''))
                    percentage = int(match.group(3))
                    
                    areas_per_pitch.append({
                        'pitch': pitch,
                        'area': area,
                        'percentage': percentage
                    })
                    logger.debug(f"Found pitch area (fallback): {pitch} - {area} sq ft ({percentage}%)")
                except Exception as e:
                    logger.error(f"Error processing pitch row match: {match.group(0)} - {e}")
                    continue

            if not areas_per_pitch:
                logger.warning("No pitch rows found in table text")
                logger.debug("Table text was:")
                logger.debug(table_text)

            return areas_per_pitch

        except Exception as e:
            logger.error(f"Error in fallback extraction: {e}")
            return []

    def extract_measurements(self, pdf_content: bytes) -> Dict[str, Any]:
        """Extract measurements from PDF content."""
        try:
            if not pdf_content:
                raise ValueError("Empty PDF content")

            # Save PDF content temporarily to use with Camelot
            temp_pdf_path = "temp_eagleview.pdf"
            with open(temp_pdf_path, "wb") as f:
                f.write(pdf_content)

            # Extract text using pdfplumber for non-table content
            pdf_file = BytesIO(pdf_content)
            with pdfplumber.open(pdf_file) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)

            if not text.strip():
                raise ValueError("No text could be extracted from PDF")

            # Extract basic measurements first
            measurements = {}
            length_measurements = {}

            # Extract total area
            total_area_match = self.patterns['total_area'].search(text)
            if total_area_match:
                total_area = float(total_area_match.group(1).replace(',', ''))
            else:
                raise ValueError("Total area not found in PDF")

            # Calculate total squares
            total_squares = total_area / 100

            # Extract predominant pitch
            predominant_pitch_match = self.patterns['predominant_pitch'].search(text)
            predominant_pitch = predominant_pitch_match.group(1) if predominant_pitch_match else None

            # Extract length measurements
            for key in ['ridges', 'valleys', 'eaves', 'rakes', 'hips', 'flashing', 'step_flashing']:
                try:
                    match = self.patterns[key].search(text)
                    if match:
                        length = float(match.group(1).replace(',', ''))
                        logger.debug(f"Found {key} length: {length}")
                        count = self.find_measurement_with_count(text, key, length)
                        logger.debug(f"Found {key} count: {count}")
                        length_measurements[key] = {
                            'length': length,
                            'count': count
                        }
                except Exception as e:
                    logger.error(f"Error processing {key}: {e}")
                    continue

            # Calculate drip edge
            if 'rakes' in length_measurements and 'eaves' in length_measurements:
                rakes_data = length_measurements['rakes']
                eaves_data = length_measurements['eaves']
                length_measurements['drip_edge'] = {
                    'length': rakes_data['length'] + eaves_data['length'],
                    'count': 1
                }

            # Try to extract areas per pitch using Camelot first
            areas_per_pitch = self.extract_areas_per_pitch_camelot(temp_pdf_path)
            
            # If Camelot fails, use fallback method
            if not areas_per_pitch:
                logger.warning("Camelot extraction failed, using fallback method")
                areas_per_pitch = self.extract_areas_per_pitch_fallback(text)

            # Clean up temporary file
            try:
                os.remove(temp_pdf_path)
            except Exception as e:
                logger.error(f"Error removing temporary PDF file: {e}")

            # Compile final measurements
            measurements = {
                'total_area': total_area,
                'total_squares': total_squares,
                'predominant_pitch': predominant_pitch,
                'areas_per_pitch': areas_per_pitch,
                **length_measurements
            }

            return measurements

        except Exception as e:
            logger.error(f"Error extracting measurements: {e}")
            # Clean up temporary file in case of error
            try:
                if os.path.exists("temp_eagleview.pdf"):
                    os.remove("temp_eagleview.pdf")
            except:
                pass
            raise 