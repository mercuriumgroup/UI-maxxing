export interface ExtractionManifest {
  readonly url: string
  readonly timestamp: string
  readonly breakpoints: readonly number[]
  readonly modules: readonly string[]
  readonly outputDir: string
  readonly framework: FrameworkDetection | null
  readonly results: Record<string, string>
}

export interface ElementSelector {
  readonly tag: string
  readonly classes: string
  readonly id: string
  readonly depth: number
  readonly path: string
}

export interface ComputedStyleEntry {
  readonly selector: ElementSelector
  readonly display: string
  readonly position: string
  readonly width: string
  readonly height: string
  readonly margin: string
  readonly padding: string
  readonly gap: string
  readonly fontSize: string
  readonly fontWeight: string
  readonly fontFamily: string
  readonly lineHeight: string
  readonly letterSpacing: string
  readonly color: string
  readonly backgroundColor: string
  readonly borderRadius: string
  readonly boxShadow: string
  readonly opacity: string
  readonly zIndex: string
  readonly overflow: string
  readonly textTransform: string
}

export interface ColorEntry {
  readonly hex: string
  readonly rgb: string
  readonly hsl: string
  readonly usageCount: number
  readonly properties: readonly string[]
  readonly sampleElements: readonly string[]
}

export interface TypographyEntry {
  readonly fontFamily: string
  readonly fontSize: string
  readonly fontWeight: string
  readonly lineHeight: string
  readonly letterSpacing: string
  readonly textTransform: string
  readonly sampleText: string
  readonly usageCount: number
}

export interface FontFaceEntry {
  readonly family: string
  readonly weight: string
  readonly style: string
  readonly src: string
  readonly format: string
  readonly display: string
  readonly unicodeRange: string
}

export interface LayoutEntry {
  readonly selector: string
  readonly display: string
  readonly flexDirection: string
  readonly flexWrap: string
  readonly justifyContent: string
  readonly alignItems: string
  readonly gap: string
  readonly gridTemplateColumns: string
  readonly gridTemplateRows: string
  readonly maxWidth: string
  readonly children: readonly LayoutEntry[]
}

export interface BreakpointEntry {
  readonly query: string
  readonly minWidth: number | null
  readonly maxWidth: number | null
  readonly source: string
}

export interface ComponentEntry {
  readonly name: string
  readonly selector: string
  readonly html: string
  readonly states: Record<string, Record<string, string>>
  readonly dimensions: { readonly width: string; readonly height: string }
  readonly children: readonly ComponentEntry[]
  readonly framework: string | null
}

export interface AssetEntry {
  readonly type: 'image' | 'svg' | 'font' | 'icon'
  readonly src: string
  readonly localPath: string | null
  readonly dimensions: { readonly width: number; readonly height: number } | null
  readonly format: string
  readonly metadata: Record<string, string>
}

export interface AnimationEntry {
  readonly selector: string
  readonly type: 'transition' | 'keyframes'
  readonly property: string
  readonly duration: string
  readonly timingFunction: string
  readonly delay: string
  readonly keyframes: readonly KeyframeEntry[] | null
}

export interface KeyframeEntry {
  readonly offset: string
  readonly styles: Record<string, string>
}

export interface BehaviorEntry {
  readonly selector: string
  readonly events: readonly string[]
  readonly scrollBehavior: string | null
  readonly position: string | null
  readonly formValidation: FormValidationEntry | null
}

export interface FormValidationEntry {
  readonly type: string
  readonly required: boolean
  readonly pattern: string | null
  readonly minLength: number | null
  readonly maxLength: number | null
  readonly min: string | null
  readonly max: string | null
}

export interface FrameworkDetection {
  readonly frameworks: readonly FrameworkEntry[]
  readonly cssMethodology: readonly CSSMethodologyEntry[]
  readonly componentLibrary: readonly ComponentLibraryEntry[]
}

export interface FrameworkEntry {
  readonly name: string
  readonly version: string | null
  readonly confidence: number
  readonly signals: readonly string[]
}

export interface CSSMethodologyEntry {
  readonly name: string
  readonly confidence: number
  readonly signals: readonly string[]
}

export interface ComponentLibraryEntry {
  readonly name: string
  readonly confidence: number
  readonly signals: readonly string[]
}

export interface VisualExtractionResult {
  readonly styles: readonly ComputedStyleEntry[]
  readonly colors: readonly ColorEntry[]
  readonly shadows: readonly string[]
  readonly borderRadii: readonly string[]
}

export interface TypographyExtractionResult {
  readonly scale: readonly TypographyEntry[]
  readonly fontFaces: readonly FontFaceEntry[]
  readonly fontLoadStrategy: string | null
}

export interface LayoutExtractionResult {
  readonly containers: readonly LayoutEntry[]
  readonly breakpoints: readonly BreakpointEntry[]
  readonly rootMaxWidth: string | null
}

export interface ComponentExtractionResult {
  readonly components: readonly ComponentEntry[]
  readonly totalElements: number
}

export interface AssetExtractionResult {
  readonly assets: readonly AssetEntry[]
  readonly downloadedCount: number
  readonly failedDownloads: readonly string[]
}

export interface AnimationExtractionResult {
  readonly transitions: readonly AnimationEntry[]
  readonly keyframes: readonly AnimationEntry[]
}

export interface BehaviorExtractionResult {
  readonly interactions: readonly BehaviorEntry[]
  readonly scrollBehaviors: readonly BehaviorEntry[]
  readonly forms: readonly BehaviorEntry[]
}

export interface NetworkExtractionResult {
  readonly endpoints: readonly NetworkEndpoint[]
  readonly harPath: string | null
}

export interface NetworkEndpoint {
  readonly method: string
  readonly url: string
  readonly status: number
  readonly contentType: string
  readonly payloadSize: number
}
