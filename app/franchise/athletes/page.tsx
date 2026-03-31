import { redirect } from 'next/navigation'

/** GRUP K — sporcu gelişim detayı `/franchise/athletes/[id]`; liste `ogrenci-yonetimi` */
export default function FranchiseAthletesIndexPage() {
  redirect('/franchise/ogrenci-yonetimi')
}
