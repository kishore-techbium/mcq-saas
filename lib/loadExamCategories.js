import { supabase } from './supabase'

export async function loadExamCategories() {

  const { data, error } = await supabase
    .from('exam_categories')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) {
    console.log(error)
    return []
  }

  return data || []
}
