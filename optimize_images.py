from PIL import Image
import os

def optimize_image(input_path, output_path, quality=85):
    try:
        # Open image
        img = Image.open(input_path)
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        # Calculate new dimensions while maintaining aspect ratio
        max_size = 1200
        ratio = min(max_size/float(img.size[0]), max_size/float(img.size[1]))
        if ratio < 1:
            new_size = tuple([int(x*ratio) for x in img.size])
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            
        # Save as WebP
        webp_path = os.path.splitext(output_path)[0] + '.webp'
        img.save(webp_path, 'WEBP', quality=quality, optimize=True)
        print(f"Optimized: {input_path} -> {webp_path}")
        
    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}")

def process_directory(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for root, _, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                input_path = os.path.join(root, file)
                rel_path = os.path.relpath(input_path, input_dir)
                output_path = os.path.join(output_dir, rel_path)
                output_folder = os.path.dirname(output_path)
                
                if not os.path.exists(output_folder):
                    os.makedirs(output_folder)
                    
                optimize_image(input_path, output_path)

if __name__ == '__main__':
    input_dir = 'images'
    output_dir = 'images/optimized'
    process_directory(input_dir, output_dir)
