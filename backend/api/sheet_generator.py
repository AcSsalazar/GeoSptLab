from oletools.olevba import VBA_Parser
from oletools import olevba
import os


def extract_vba_macros(filepath):
    """
    Extrae las macros VBA de un archivo Excel (.xlsm)
    """
    try:
        print(f"Analizando archivo: {filepath}")
        vp = VBA_Parser(filepath)
        
        if vp.detect_vba_macros():
            print("✅ Se detectaron macros VBA en el archivo")
        else:
            print("❌ No se detectaron macros VBA en el archivo")
            return []
        
        macros = []
        
        for (filename, stream_path, vba_filename, vba_code) in vp.extract_all_macros():
            macro_info = {
                'filename': filename,
                'stream_path': stream_path,
                'vba_filename': vba_filename,
                'vba_code': vba_code
            }
            macros.append(macro_info)
            print(f"--- {vba_filename} ---")
            print(vba_code[:500])  # vista previa de los primeros 500 caracteres
            print("...")
            
        return macros
    except Exception as e:
        print(f"Error al extraer macros VBA: {e}")
        return []


def save_vba_to_file(filepath, output_file="vba_dump.txt"):
    """
    Extrae macros VBA y las guarda en un archivo de texto
    """
    macros = extract_vba_macros(filepath)
    
    if macros:
        with open(output_file, 'w', encoding='utf-8') as f:
            for macro in macros:
                f.write(f"--- {macro['vba_filename']} ---\n")
                f.write(macro['vba_code'])
                f.write("\n\n" + "="*50 + "\n\n")
        print(f"✅ Macros VBA guardadas en: {output_file}")
        print(f"Se encontraron {len(macros)} macro(s)")
    else:
        print("❌ No se encontraron macros VBA en el archivo")


# Ejemplo de uso
if __name__ == "__main__":
    # Obtener directorio actual
    current_dir = os.path.dirname(os.path.abspath(__file__))
    excel_file = "1.xlsm"
    full_path = os.path.join(current_dir, excel_file)
    
    print(f"Directorio actual: {current_dir}")
    print(f"Buscando archivo: {full_path}")
    
    if os.path.exists(full_path):
        print(f"✅ Archivo encontrado: {excel_file}")
        file_size = os.path.getsize(full_path)
        print(f"Tamaño del archivo: {file_size} bytes")
        save_vba_to_file(full_path)
    else:
        print(f"❌ Archivo {excel_file} no encontrado")
        print("Archivos disponibles en el directorio:")
        for file in os.listdir(current_dir):
            if file.endswith(('.xls', '.xlsx', '.xlsm')):
                print(f"  📄 {file}")
