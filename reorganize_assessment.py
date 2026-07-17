#!/usr/bin/env python3
"""
Reorganize Part 1 assessment from 4 sections to 9 career-path-based sections.
Select 4 questions per path from the current 12.
"""

import json

# Load current assessment data
with open('web/src/data/assessment-data.json', 'r') as f:
    data = json.load(f)

# Path descriptions for headings
path_descriptions = {
    "Clinical Care Path": "Care, health, wellbeing; supporting people in recovery and daily needs.",
    "Protection Path": "Safety, justice, emergency response; staying calm and decisive under pressure.",
    "Learning & Support Path": "Teaching, coaching, youth work, community support; helping people grow.",
    "Build & Fix Path": "Hands-on building/repair, skilled trades, transportation, technical maintenance.",
    "STEM Systems Path": "Tech, engineering, data, systems; solving problems with tools and logic.",
    "Business Growth & Leadership Path": "Leadership, strategy, selling, organizing teams, entrepreneurship.",
    "Creative Path": "Design, media, creative problem-solving; making ideas visible and meaningful.",
    "Experience & Service Path": "Service, events, food, customer experience; making spaces run smoothly.",
    "Outdoor Systems Path": "Outdoors, environment, agriculture, animals; caring for land and resources."
}

# Collect all questions grouped by primary path
path_questions = {}
for section_key, section in data['sections'].items():
    for item in section['items']:
        primary_path = item.get('primaryPath')
        if primary_path:
            if primary_path not in path_questions:
                path_questions[primary_path] = []
            path_questions[primary_path].append(item)

# For each path, select 4 questions that best represent different aspects
# Strategy: Pick 1 from interests, 1 from strengths, 1 from drivers, 1 from conditions
selected_questions = {}

for path, questions in path_questions.items():
    # Group by section
    by_section = {
        'interests': [],
        'strengths': [],
        'drivers': [],
        'conditions': []
    }
    
    for q in questions:
        section = q['section']
        if section in by_section:
            by_section[section].append(q)
    
    # Select questions to get exactly 4
    selected = []
    # Try to get 1 from each section first
    for section in ['interests', 'strengths', 'drivers', 'conditions']:
        if by_section[section] and len(selected) < 4:
            selected.append(by_section[section][0])
    
    # If we don't have 4 yet, add more from sections with multiple questions
    if len(selected) < 4:
        for section in ['interests', 'strengths', 'drivers', 'conditions']:
            for q in by_section[section][1:]:  # Start from index 1 (skip first which we already added)
                if len(selected) < 4:
                    selected.append(q)
    
    selected_questions[path] = selected

# Create new section structure
path_code_map = {
    "Clinical Care Path": "clinical_care",
    "Protection Path": "protection", 
    "Learning & Support Path": "learning_support",
    "Build & Fix Path": "build_fix",
    "STEM Systems Path": "stem_systems",
    "Business Growth & Leadership Path": "business_leadership",
    "Creative Path": "creative",
    "Experience & Service Path": "experience_service",
    "Outdoor Systems Path": "outdoor_systems"
}

new_sections = {}
for path in data['pathCodes']:
    path_name = data['pathNames'][path]
    section_key = path_code_map[path_name]
    
    new_sections[section_key] = {
        "label": path_name,
        "subtitle": path_descriptions[path_name],
        "items": selected_questions.get(path_name, [])
    }

# Create new assessment structure
new_data = {
    "pathNames": data['pathNames'],
    "pathCodes": data['pathCodes'],
    "sections": new_sections,
    "weights": data['weights'],
    "thresholds": data['thresholds'],
    "fitLabels": data['fitLabels'],
    "pathDescriptions": data['pathDescriptions'],
    "scale": data['scale']
}

# Save to new file
with open('web/src/data/assessment-data-new.json', 'w') as f:
    json.dump(new_data, f, indent=2)

print("Created new assessment structure with 9 sections (36 questions)")
print("\nQuestions per path:")
for path, questions in selected_questions.items():
    print(f"  {path}: {len(questions)} questions")
